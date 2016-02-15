var mongoose = require("mongoose");  
var Schema = mongoose.Schema;

var jobSchema = new Schema({
	name: {type: String, required: true},
	startTime: {type: String, required: true},
	enabled: {type: Boolean, default: false},
	daysOfWeek : [Number],
	phases: [{
		port: {type: Schema.Types.ObjectId, ref: "Port"},
		duration: Number
	}]
});

var Job = mongoose.model('Job', jobSchema);

module.exports = Job;
