var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var expressSession = require('express-session');
var mongo = require('mongoose');
var fs = require("fs");

// Load configuration file
var config = require("./config.js");

var passport = require("./lib/passport.js");
var dataCollector = require("./lib/dataCollector.js");

var status = require("./routes/status");
var control = require("./routes/control");
var settings = require("./routes/settings");
var auth = require("./routes/auth")(passport);

var jobExecutor = require("./lib/jobExecutor.js");

// Connect to mongodb
mongo.connect("mongodb://localhost/LawnSprinkler", function(err) {
	if (err) {
		console.log("Cannot connect to database", err);
		process.exit(1);
	} else {
		jobExecutor.initJobs();
	}
});


var app = express();

// Server setup
app.set('port', config.port);


app.set('env', 'development');
// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(compress());
app.use(expressSession({secret: 'mySecretKey', saveUninitialized: true, resave: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public'), {maxAge: 86400000 })); // 1 day


//Authentication wont be required for /auth, but will be for everything else bellow
app.use('/auth', auth);
app.use(passport.requireAuth);

app.use('/', status);
app.use('/status', status);
app.use('/control', control);
app.use('/settings', settings);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

// Start server
http.createServer(app).listen(app.get('port'), function(){
	console.log('Server started listening at port ' + app.get('port'));
});
