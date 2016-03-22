var config = {};

// Server settings
config.port = 8080;

// Login settings
config.username = "operator";
config.password = "tajneheslo";

// RaspberryPi settings
config.rp_gpio = false;

// MQTT settings
config.mqtt_broker_host = "mqtt://192.168.2.116";


module.exports = config;