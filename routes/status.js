var express = require('express');
var async = require('async');

var dataCollector = require("./../lib/dataCollector.js");
var eventLogger = require("./../lib/eventLogger.js");

var router = express.Router();

var ejsData = { title: 'Lawn Sprinkler',
                  sectionName: 'Status',
                  subsections: [ {name:'Overview', view:'overview'},
                                 {name: 'Logs', view:'logs'}
                               ]
                 };

/* GET Status page. */
router.get('/', function(req, res) {
    async.parallel([
        //Setup Overview view data
        function(callback) {
            //ejsData.sensorData = {};

            ejsData.sensorData = dataCollector.getLastUpdate();
            callback();
        },
        // Setup Logs view
        function(callback) {
            eventLogger.getEventLogs(function(err, events) {
                if (err) {
                    console.log(err);
                }
                
                ejsData.events = events;
                callback();
            }, 10);
        }],
        //Final callback
        function(err) {
            if (err) {
                console.log(err);
            }
            res.render('page', ejsData);
        });
});

router.get('/sensorUpdate', function(req, res) {
    res.send(dataCollector.getLastUpdate());
});

module.exports = router;
