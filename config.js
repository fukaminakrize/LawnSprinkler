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

// Email notifications
config.mail_notifications_enabled = true;
config.mail_username = "test@test.com";
config.mail_password = "password";
config.mail_smtp_server = "smtp.test.com";
config.mail_notification_address = "receiver@test.com";


module.exports = config;