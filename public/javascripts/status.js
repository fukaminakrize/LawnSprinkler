$(document).ready(function () {
    var refreshInterval = 5000;

    function setSensorData(sensorJson) {
        $("#sensor_water_level").text(sensorJson.water_level);
        $("#sensor_moisturelevel").text(sensorJson.moisture_level);
        $("#sensor_temperature").text(sensorJson.temperature);

        $("#sensor_last_update").text(new Date(sensorJson.timestamp).toLocaleString());
    }

    var refreshSensorData = function() {
        $.ajax({
            url: "/status/sensorUpdate"
        }).done(function (resJson) {
            if (resJson !== false) {
                setSensorData(resJson);
            }
        }).always(function () {
            setTimeout(refreshSensorData, refreshInterval);
        })
    };

    refreshSensorData()
});