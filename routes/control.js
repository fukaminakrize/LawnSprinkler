/*
	todo: pri odstranovani portu, odstranit aj referenciu nan v jobe (http://mongoosejs.com/docs/middleware.html)

*/

var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');

var Port = require(path.join(__dirname, '../model/port.js'));
var Job = require(path.join(__dirname, '../model/job.js'));

var jobExecutor = require(path.join(__dirname, '../lib/jobExecutor.js'));

var ejsData = { title: 'Lawn Sprinkler',
                sectionName: 'Control',
                subsections: [ 
                               {name: 'Scheduler', view:'scheduler'},
                               {name:'Manual control', view:'manual'},
                               ]
                };

/* GET Status page. */
router.get('/', function(req, res, next) {

 	async.parallel([
 		//Setup manual control view data
 		function(callback) {
 			ejsData.manualControl = {};

 			//Get all ports
 			Port.find(function(err, ports) {
 				if (err) return callback(err);

 				ejsData.manualControl.ports = ports;

 				callback();
 			});
 		},
 		//Setup scheduler view data
 		function(callback) {
 			ejsData.scheduler = {};

 			//Get all jobs with populated ports's durations
 			Job.find().populate("phases.port", "duration").exec(function(err, jobs) { 
 				if (err) return callback(err);

 				ejsData.scheduler.jobs = jobs;

 				callback();
 			});
 		}],
 		//Final callback
 		function(err) {
 			if (err)
 				console.log(err)

 			res.render('page', ejsData);
 		})
 });

// Port control
/* PUT port state */
router.put('/portState', function(req, res, next) {
	var portId = req.body.portId;
	var state = req.body.state || false;

	var resJSON = {};

	if (!portId) {
		resJSON.err = "Invalid port id";
		res.send(resJSON);
	} else {
		//Get port by given id
		//todo: fetchnut aj master port a potom ho nastavit
		Port.findById(portId, function(err, port) {
			if (err) {
				resJSON.err = err;
			} else {
				port.setState(state);
				resJSON.port = port;
				port.save();
			}	

			res.send(resJSON);			
		});	
	}
});

// Scheduler
/* GET job, by id or all */
router.get('/job', function(req, res, next) {
	var jobId = req.query.jobId;

	var resJSON = {};

	if (jobId) {
		Job.findById(jobId).populate("phases.port", "name").exec(function(err, job) { 
			if (err)
				resJSON.err = true;
			else {
				resJSON.job = job;
			
			}
			res.send(resJSON);
		});

	} else {
		Job.find(function(err, jobs) { 
			if (err)
				resJSON.err = true;
			else
				resJSON.jobs = jobs;

			res.send(resJSON);
		});
	}
});

/* POST job, update or create */
router.post('/job', function(req, res, next) {
	var jobId = req.body.jobId;
	var jobName = req.body.jobName
	var jobStartTime = req.body.jobStartTime;

	//days of repetition will be in req body like jobRepeat_1: 'on', so iterate through fields in body, find fields beginning with jobRepeat_ followed by day number, that have "on" value and if its not already in array of days, push it there
	var jobRepeatRegex = /jobRepeat_(\d+)$/;
	var jobRepeatDays = [];
	for (field in req.body) {
		var match = jobRepeatRegex.exec(field);
		if ((match) && (req.body[field] == "on")) {
			var jobRepeatDay = match[1];
			if (jobRepeatDays.indexOf(jobRepeatDay) < 0) {
				jobRepeatDays.push(jobRepeatDay);
			}
		}
	}

	var jobData = { 
		name: jobName,
		startTime: jobStartTime,
		daysOfWeek: jobRepeatDays
	};

	//called after db update or create, logs error and redirects user to /control
	var postDbCallback = function (err) {
		if (err) {
			console.log(err);
		} else {
			//reschedule job execution
			jobExecutor.rescheduleJob(jobId);
		}

		res.redirect('/control');
	}

	//console.log(jobData)

	//update existing job
	if (jobId) {
		console.log("Updating existing job");

		Job.findByIdAndUpdate(jobId, jobData, postDbCallback);
	//create new job
	} else {
		console.log("Creating new job");

		var newJob = new Job(jobData);
		newJob.save(postDbCallback);
	}
});

/* DELETE job */
router.delete('/job', function(req, res, next) {
	var jobId = req.body.jobId;
	if (!jobId) {
		res.send({err: "Invalid job ID"});
	} else {
		Job.findByIdAndRemove(jobId, function(err) {
			res.send({err: err});
		});
	}
});

/* PUT job enable */
router.put('/jobEnable', function(req, res, next) {
	var jobId = req.body.jobId;
	var enabled = (req.body.enabled == "true");

	var resJSON = {};

	if (!jobId) {
		resJSON.err = "Invalid job id";
		res.send(resJSON);
	} else {
		//Get job by given id
		Job.findById(jobId, function(err, job) {
			if (err) {
				resJSON.err = err;
			} else {
				//If disabling enabled job, cancel it
				if (job.enabled == true && enabled == false) {
					jobExecutor.cancelJob(job._id);
				}

				job.enabled = enabled;
				job.save();
			}

			res.send(resJSON);
		});	
	}
});

/* POST job phase */
router.post('/jobPhase', function(req, res, next) {
	var jobId = req.body.jobId;
	var portId = req.body.portId;
	var duration = req.body.duration || 0;

	var resJSON = {};

	if (!jobId || !portId) {
		resJSON.err = "Invalid job or port id";
		res.send(resJSON);
	} else {
		//Get job by given id
		Job.findById(jobId, function(err, job) {
			if (err) {
				resJSON.err = err;
			} else {
				var phase = {
					port: portId,
					duration: duration
				}

				job.phases.push(phase)
				job.save();
				resJSON.phase = phase;

				//reschedule job execution
				jobExecutor.rescheduleJob(jobId);
			}	

			res.send(resJSON);			
		});	
	}
});


/* DELETE job phase */
router.delete('/jobPhase', function(req, res, next) {
	var jobId = req.body.jobId;
	var phaseId = req.body.phaseId;

	var resJSON = {};

	if (!jobId || !phaseId) {
		res.send({err: "Invalid job or phase ID"});
	} else {
		Job.findById(jobId, function(err, job) {
			if (err) {
				resJSON.err = err;
			} else {
				//remove phase with id from the job
				for (var phaseIndex = job.phases.length - 1; phaseIndex >= 0; phaseIndex--) {
					if (job.phases[phaseIndex]._id == phaseId) {
						job.phases.splice(phaseIndex, 1);
						break;
					}
				}
			
				job.save();

				//reschedule job execution
				jobExecutor.rescheduleJob(jobId);
			}	

			res.send(resJSON);			
		});
	}
});




module.exports = router;
