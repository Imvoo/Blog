var express = require('express');
var app = express();

var port = 5000;

app.get('/', function(req, res) {
	res.send("Hello World!");
});

app.listen(port);
console.log("Server has started on port: " + port + "!");
