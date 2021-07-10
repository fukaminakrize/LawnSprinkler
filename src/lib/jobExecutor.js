//  http://www.nncron.ru/help/EN/working/cron-format.htm

var path = require("path");
var scheduler = require("node-schedule");
var async = require("async");
var request = require("request");

var Port = require("./../model/port.js");
var Job = require("./../model/job.js");

var eventLogger = require("./eventLogger.js");
var config = require("./../config.js");

// Associative array: jobId -> cronJob
cronJobs = {};


// Get all Jobs and setup and start cron jobs for them
function initJobs() {
	// Get all jobs
	Job.find(function(err, jobs) {
		if (err) {
			console.log(err);
			return;
		}

		// For each job, schedule and store cron job
		jobs.forEach(function (job) {
			var cronJob = scheduleCronJobForJob(job);
			if (cronJob)
				cronJobs[job._id] = cronJob;
		});
	});
}

//Reschedule cron job for job
function rescheduleJob(jobId) {
	cancelJob(jobId);

	Job.findById(jobId, function (err, job) {
		if (err) {
			console.log(err);
			return;
		}
			
		console.log("Rescheduling job");

		// Cancel existing cron job
		if (cronJobs[job._id]) {
			cronJobs[job._id].cancel();
		}
		// Schedule new
		var cronJob = scheduleCronJobForJob(job);
		if (cronJob) {
			cronJobs[job._id] = cronJob;
		}
	});
}

// Cancel execution of given job
function cancelJob(jobId) {
	// Canceled property will be checked at the end of the stop phase and if is enabled, it will terminate job execution
	var cronJob = cronJobs[jobId];
	if (cronJob && (cronJob.canceled === false)) {
		console.log("Canceling job: " + jobId);
		cronJob.canceled = true;
	}
}

// Schedule cron job for given job
function scheduleCronJobForJob(job) {
	var jobStartTimeHourAndMinute = job.startTime.split(":");
	if (jobStartTimeHourAndMinute.length != 2) {
		console.log("Job have invalid start time (invalid format)");
		return false;
	}
	var hour = parseInt(jobStartTimeHourAndMinute[0]);
	var minute = parseInt(jobStartTimeHourAndMinute[1]);
	if ((hour < 0) || (hour >= 24) || (minute < 0) || (minute >= 60)) {
		console.log("Job have invalid start time (out of time range)");
		return false;
	}

	// Convert sunday's 7 to 0
	var sundayIndex = job.daysOfWeek.indexOf(7);
	if (sundayIndex >= 0)
		job.daysOfWeek[sundayIndex] = 0;

	// Create cron time rule
	var scheduleRule = new scheduler.RecurrenceRule();
	scheduleRule.dayOfWeek = job.daysOfWeek;
	scheduleRule.hour = hour;
	scheduleRule.minute = minute;

	// Job without any days will crash it, so a little workaround is needed
	if (job.daysOfWeek.length == 0) {
		scheduleRule.dayOfWeek = [0];
		scheduleRule.year = 2099;
	}

	var cronJob = scheduler.scheduleJob(scheduleRule, function() { 
		cronJobCallback(job._id); 
	});

	if (!cronJob) {
		console.log("Failed to schedule job");
	}

	return cronJob;
}


// Cron job callback
function cronJobCallback(jobId) {
	//console.log("jobId: " + jobId);

	var checkRainTodayCallback = function(nextCallback) {
		if (!config.precipitationLimit || !config.weatherApiKey || !config.city) {
			nextCallback();
		}

		var url = "http://api.openweathermap.org/data/2.5/forecast?q=" + config.city + "&units=metric&appid=" + config.weatherApiKey;
		request(url, function (err, resp, body) {
			if (err) {
				nextCallback(err);
			} else if (!resp) {
				nextCallback("No response");
			} else if (resp.statusCode != 200) {
				nextCallback("Not Ok")
			}

			weatherData = JSON.parse(body);
			
			// In mm
			precipitation = 0.0;
			// Take first 4 records
			// Each will after 3 hours, 12 total
			weatherData.list.slice(0, 4).forEach(function(rec) {
				if (rec.rain && rec.rain["3h"])
					precipitation += rec.rain["3h"];
			});
			if (precipitation >= config.precipitationLimit) {
				eventLogger.logEvent("Canceling job due to the rain (" + precipitation + " mm)", true);
				nextCallback("rain");
			} else {
				nextCallback();
			}
		});
	};

	var jobStartCallback = function(nextCallback) {
		eventLogger.logEvent(eventDescription, true);
		nextCallback();
	};

	// Set given state to every master port
	var setMasterPortsStateCallback = function(state) { return function(nextCallback) {
		//fetch all master ports
		Port.find({master: true}, function(err, masterPorts) {
			if (err) {
				nextCallback(err);
			} else {
				// For each master port set state and then save it with next master port callback. and finally call nextCallback to begin next execution phase
				async.each(masterPorts, function(masterPort, nextMasterPortCallback) {
					console.log("Turning " + (state ? "on" : "off") + " master port: " + masterPort.name);
					masterPort.setState(state);
					masterPort.save(nextMasterPortCallback)
				}, nextCallback);
			}
		});
	}};

	// Turns on the port
	var phaseStartCallback = function(port) { return function(nextCallback) {
		console.log("Turning on port: " + port.name);
		port.setState(true);
		port.save(nextCallback);
	}};

	// Timer delay
	var phaseDurationCallback = function(duration) { return function(nextCallback) {
		console.log("Duration: " + duration + " minutes");
		var ms = duration * 60000;  			//duration is in minutes
		setTimeout(nextCallback, ms);
	}};

	// Turn off the port
	var phaseStopCallback = function(port) { return function(nextCallback) {
		console.log("Turning off port: " + port.name);
		port.setState(false);
		port.save(function() {
			// If job is canceled, dont continue to the next phase, but return "error" to stop the job execution
			if (cronJobs[jobId].canceled)
				nextCallback("Canceled");
			else
				nextCallback();
		});		
	}};

	var finalCallback = function(err) {
		if (err) {
			console.log("Task has ended with error: " + err);

			//Turn off master ports
			(setMasterPortsStateCallback(false))(function(err) {
				if (err) console.log(err);
			});
		} else {
			console.log("All tasks have ended successfully");
		}
	};


	// Fetch given job and plan it's execution
	Job.findById(jobId).populate("phases.port").exec(function (err, job) { 
		if (err) {
			console.log(err);
			return;
		}

		if (!job.enabled) {
			console.log("Not executing disabled job");
			return;
		}

		cronJobs[jobId].canceled = false;

		var executionPhases = [];

		executionPhases.push(checkRainTodayCallback);

		// Turn on master ports
		executionPhases.push(setMasterPortsStateCallback(true));

		job.phases.forEach(function (phase) {
			// Ensure that the phase have some duration
			if (phase.duration <= 0)
				return;

			executionPhases.push(phaseStartCallback(phase.port));
			executionPhases.push(phaseDurationCallback(phase.duration));
			executionPhases.push(phaseStopCallback(phase.port));
		});

		// Turn off the master ports
		executionPhases.push(setMasterPortsStateCallback(false));

		console.log("Starting execution of " + job.name + " at " + job.startTime);

		// Log and email event
		var eventDescription = job.name + ":";
		job.phases.forEach(function (phase) {
			eventDescription += "\n" + phase.port.name + " " + phase.duration + " minutes";
		});
		eventLogger.logEvent(eventDescription, true);

		async.series(executionPhases, finalCallback);
	});
}

module.exports.initJobs = initJobs;
module.exports.rescheduleJob = rescheduleJob;
module.exports.cancelJob = cancelJob;

