var config = {};

// Server settings
config.port = 8080;

// Login settings
config.auth = true;
config.username = "user";
config.password = "pass";

// RaspberryPi settings
config.rp_gpio = false;

// MQTT settings
config.mqtt_broker_host = "mqtt://192.168.0.101";

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

module.exports = config;
