module.exports = function(passport) {
	var express = require("express");
	var router = express.Router();

	/* GET Settings page. */
	router.get("/", function(req, res, next) {
		res.redirect("/auth/login/"); 
	});

	router.get("/login", function(req, res, next) {
		//res.send("login page");
		res.render('login', {});
	});

	router.post("/login", passport.authenticate("local", {
		failureRedirect: "/auth/login",
		successRedirect: "/"
	}));

	router.get("/logout", function(req, res, next) {
		if (req.isAuthenticated()) {
			req.session.destroy(function() {
				res.redirect("/");
			});	//todo: 
			//req.logout();
		}
		res.redirect("/");
	});

	return router;
};





