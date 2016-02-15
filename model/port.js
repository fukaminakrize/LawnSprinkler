// Load configuration file
var config = require("../config.js");

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
if (config.rp_gpio)
	var GPIO = require('onoff').Gpio;

var portSchema = new Schema({
	GPIOPortNum: { type: Number, required: true},
	name: { type: String, default: ""},
	master: { type: Boolean, default: false},
	state: { type: Boolean, default: false}
});



var initializedPorts = {};


portSchema.methods.setState = function(state) {
	this.state = state;

	if (config.rp_gpio) {
		// Set GPIO port
		// If not opened, open it
		if (!initializedPorts[this.GPIOPortNum]) {
			console.log("Initializing GPIO port " + this.GPIOPortNum);
			initializedPorts[this.GPIOPortNum] = new GPIO(this.GPIOPortNum, 'out');
		}
		// Set new state
		initializedPorts[this.GPIOPortNum].writeSync(Number(this.state));	
	} else {
		console.log("Simulating port " + this.name + ": " + (Number(this.state) ? "on" : "off"));
	}
};

var Port = mongoose.model('Port', portSchema);

Port.GPIOList = [4,17,18,22,23,24,25,27];


module.exports = Port;
