var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var sensorRecordSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    water_level: {type: Number},
    moisture_level: {type: Number},
    temperature: {type: Number}
});

var SensorRecord = mongoose.model("SensorRecord", sensorRecordSchema);

module.exports = SensorRecord;
