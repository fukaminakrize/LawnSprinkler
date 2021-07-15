var config = {};

// Server settings
config.port = 8000;
config.host = "localhost";

// Login settings
config.auth = true;
config.username = "user";
config.password = "pass";

// RaspberryPi settings
config.rp_gpio = false;

// MQTT settings
config.mqtt_broker_host = "mqtt://mosquito";

// Email notifications
config.mail_notifications_enabled = false;
config.mail_username = "test@test.com";
config.mail_password = "password";
config.mail_smtp_server = "smtp.test.com";
config.mail_notification_address = "receiver@test.com";

/*
config.precipitationLimit = 10;
// OpenWeatherMap API Key
config.weatherApiKey =  ""
config.city = ""
*/

config.mongo_connection_string = "mongodb://mongo/LawnSprinkler";

module.exports = config;
