var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

// Load configuration file
var config = require("../config.js");


var adminUsername = config.username;
var adminPassword = config.password;

passport.use(new LocalStrategy({
		usernameField: "username",
		passwordField: "password"
	},
	function(username, password, done) {
		if ((username == adminUsername) && (password ==  adminPassword)) {
			console.log("User successfully authenticated: " + username);
			return done(null, {username: username});
		} else {
			console.log("User authentication failed for user: " + username);
			return done(null, false);
		}
	}
));

passport.serializeUser(function(user, done) {
 	done(null, user.username);
});
 
passport.deserializeUser(function(username, done) {
	done(null, {username: username})
});

passport.requireAuth = function(req, res, next) {
	//console.log("requireAuth");

	if (!req.isAuthenticated()) {
		res.redirect("/auth/login");
	} else {
		next();
	}
};

module.exports = passport;