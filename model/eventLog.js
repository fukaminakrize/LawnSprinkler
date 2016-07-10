var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eventLogSchema = new Schema({
	timestamp: {type: Date, default: Date.now},
	description: { type: String, default: ""},
});

var EventLog = mongoose.model('EventLog', eventLogSchema);

module.exports = EventLog;
