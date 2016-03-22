const TOPIC_SENSOR_DATA_UPDATE = "sensor/update";

var config = require("../config.js");
var mqtt = require("mqtt");
var SensorRecord = require("./../model/sensorRecord.js");


var mqtt_client = mqtt.connect(config.mqtt_broker_host);
var last_record = false;

// Fetch last record from db
SensorRecord.findOne().sort("-timestamp").exec(function(err, record) {
    last_record = record;
});

mqtt_client.on("connect", function () {
    console.log("Connected to the MQTT broker");

    mqtt_client.subscribe(TOPIC_SENSOR_DATA_UPDATE);
});

mqtt_client.on("message", function (topic, raw_message) {
    //console.log(topic);

    try {
        // Convert raw_message buffer to string and parse it
        var message = JSON.parse(raw_message.toString());
    } catch (err) {
        console.error("Failed to parse the MQTT message: " + err);
        return;
    }

    switch (topic) {
        case TOPIC_SENSOR_DATA_UPDATE:
            handleSensorDataUpdate(message);
            break;
        default:
            break;
    }
});

// Save given record from sensor
function handleSensorDataUpdate(message) {
    var record_data = {
        water_level: message.water_level,
        moisture_level: message.moisture_level,
        temperature: message.temperature
    };

    var record = new SensorRecord(record_data);
    record.save(function() {
        console.log("Record saved");
        last_record = record;
    });
}

function getLastUpdate() {
    return last_record;
}

module.exports.getLastUpdate = getLastUpdate;
