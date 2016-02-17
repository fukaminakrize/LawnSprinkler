var express = require('express');
var router = express.Router();

var ejsData = { title: 'Lawn Sprinkler',
                  sectionName: 'Status',
                  subsections: [ {name:'Overview', view:'overview'},
                                 {name: 'Logs', view:'logs'},
                               ]
                 };

/* GET Status page. */
router.get('/', function(req, res, next) {
	ejsData.overview = prepareOverviewView();
	ejsData.logs = prepareLogsView();

 	res.render('page', ejsData);
});

function prepareOverviewView() {

}

function prepareLogsView() {

}


router.get('/blah', function(req, res, next) {
	res.send('fdsfs');
});

module.exports = router;
