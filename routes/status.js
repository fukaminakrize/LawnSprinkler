var express = require('express');
var async = require('async');

var dataCollector = require("../lib/dataCollector.js");

var router = express.Router();

var ejsData = { title: 'Lawn Sprinkler',
                  sectionName: 'Status',
                  subsections: [ {name:'Overview', view:'overview'},
                                 {name: 'Logs', view:'logs'}
                               ]
                 };

/* GET Status page. */
router.get('/', function(req, res, next) {
    async.parallel([
        //Setup Overview view data
        function(callback) {
            //ejsData.sensorData = {};

            ejsData.sensorData = dataCollector.getLastUpdate();
            callback();
        }],
        //Final callback
        function(err) {
            if (err) {
                console.log(err);
            }
            res.render('page', ejsData);
        });
});

router.get('/sensorUpdate', function(req, res, next) {
    res.send(dataCollector.getLastUpdate());
});

module.exports = router;
