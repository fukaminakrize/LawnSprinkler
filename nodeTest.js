var express = require('express');
var app = express();

app.get('/', function(req, res) {
        console.log(new Date().toISOString());
        setTimeout(function() {
                console.log("after 45 mins");
        }, 1000*60*45);
        res.send("blah");
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
