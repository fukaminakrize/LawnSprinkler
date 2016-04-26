var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
var exec = require('child_process').exec;

var Port = require("../model/port.js");

Array.prototype.sub = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var systemCommands = [["System shutdown", "halt"], 
						["System reboot", "reboot"],
						["Node restart", "systemctl restart lawnSprinkler"],
						["Mongo restart", "systemctl restart mongodb"]];

var ejsData = { title: 'Lawn Sprinkler',
				sectionName: 'Settings',
				subsections: [	{name:'Port settings', view:'portSettings'},
								{name:'System', view: 'system'}
								],
				systemCommands: systemCommands.map(function(cur) { return cur[0]}) /* Get system commands names (first items) */
			};


/* GET Settings page. */
router.get('/', function(req, res, next) {
	async.parallel([
		//Setup port settings view data
		function(callback) {
			ejsData.portSettings = {};

			//Get all ports
			Port.find(function(err, ports) {
				if (err) return callback(err);
				ejsData.portSettings.ports = ports;

				//Get available GPIO ports
				ejsData.portSettings.availableGPIOPorts = getAvailableGPIOPorts(ports);

				callback();
			});
		},
		//Setup system view data
		function(callback) {
			callback();
		}],
		//Final callback
		function(err) {
			if (err) {
				console.log(err);
			}
			res.render('page', ejsData);
		})
 });

/* GET port, by id or all */
router.get('/port', function(req, res, next) {
	var portId = req.query.portId;

	var resJSON = {};

	if (portId) {
		Port.findById(portId, function(err, port) { 
			if (err)
				resJSON.err = true;
			else {
				resJSON.port = port;
			}
			res.send(resJSON);
		});
	} else {
		Port.find(function(err, ports) { 
			if (err) {
				resJSON.err = true;
			} else {
				resJSON.ports = ports;
			}
			res.send(resJSON);
		});
	}
});

/* POST Edit or create port */
router.post('/port', function(req, res, next) {
	var GPIOPort = req.body.gpioNum;
	var name = req.body.portName;
	var portId = req.body.portId;
	var master = (req.body.master && (req.body.master == "on"));

	if (!GPIOPort || !name) {
		res.send("invalid request");
		return;
	}

	var portData = {
		GPIOPortNum: GPIOPort,
		name: name,
		master: master
	};

	//called after db update or create, logs error and redirects user to /settings
	var postDbCallback = function (err) {
		if (err) {
			console.log(err);
		}
		res.redirect('/settings');
	};

	if (portId) {
		console.log("Updating existing port: " + name);

		Port.findByIdAndUpdate(portId, portData, postDbCallback);
	} else {
		console.log("Creating new port: " + name + ", " + GPIOPort);

		var newPort = new Port(portData);
		newPort.save(postDbCallback);
	}

	
});

/* DELETE Port */
router.delete('/port', function(req, res, next) {
	var portId = req.body.portId;
	if (!portId) {
		res.send({err: "Invalid port ID"});
	} else {
		Port.findByIdAndRemove(portId, function(err) {
			res.send({err: err});
		});
	}
});

/* GET Available GPIO ports numbers */
router.get('/availableGPIOPorts', function(req, res, next) {
	//Get all ports
	Port.find(function(err, ports) {
		if (err) res.send({err: true});
		
		var resJSON = {};
		resJSON.allGPIOPorts = Port.GPIOList;
		
		resJSON.availableGPIOPorts = getAvailableGPIOPorts(ports)

		res.send(resJSON);	
	});
});

/* POST System command */
router.post('/systemCommand', function(req, res, next) {
	console.log(req.body);
	var action = parseInt(req.body.action);
	var timeout = parseInt(req.body.timeout);

	// Check if they are numbers
	if (isNaN(action) || isNaN(timeout)) {
		res.send({err: "Invalid data"});
	// Check action number
	} else if  ((action < 0) || (action >= systemCommands.length)) {
		res.send({err: "Invalid action"});
	} else {
		var systemCommand = systemCommands[action];
		var commandName = systemCommand[0];
		var command = systemCommand[1];
	
		// Perform system command
		setTimeout(function() {
			console.log("Executing: " + command);
			exec(command, function(error, stdout, stderr) {
				console.log("Exit status: " + error);
				console.log("Stdout: " + stdout);
				console.log("Stderr: " + stderr);
			});
		}, timeout * 1000);
	
		res.send({err: false});
	}	
});

// Get array of available GPIO port numbers
// From list of all GPIO ports, substract used
function getAvailableGPIOPorts(ports) {
	// if gifen ports object is not an Array, transform it to an array
	if (!(ports instanceof Array))
		ports = [ports];

	var usedGPIOPorts = [];
	ports.forEach(function(port) {	
		usedGPIOPorts.push(port.GPIOPortNum);
	});
	return Port.GPIOList.sub(usedGPIOPorts);
}


module.exports = router;
