//	Express.js
//	This class is the implementation of the server, handling the connections
//	made to the server and displaying the formatted HTML page in the end.

//	Initialization of starting variables.
//	Note, process.env.PORT is the randomly assigned port used by Heroku.
//	A CronJob is also used to handle the updating of the database so that
//	it doesn't rely on any external schedulers.
var express = require('express');
var app = express();
var port = Number(process.env.PORT || 5000);
var CronJob = require('cron').CronJob;
var retriever = require('./retriever');
var user = "949789";
var retrieverDelay = 5;

retriever.connect();

//	Setup the server to compress assets with GZIP and locate the server's
//	files.
app.use(express.compress());
app.set('view engine', 'jade');
app.set('views', __dirname + '/public/jade');
app.use(express.static(__dirname + '/public'));

//	TODO: Add wildcard modifier to handle separate player requests.
//	This handles the actual connections to the server, grabbing the given user's
//	avatar and scores.
app.get('/', function(req, res) 
{
	retriever.getAvatar(user, function() {
		retriever.retrieveRecent(function(err, listings)
		{
			res.render('layout', 
				{ 
					listings: listings,
				  	userAvatar: userAvatar,
				  	user: user
				})
		})
	});
});

//	Actually starts the server up and logs it to the server.
app.listen(port);
console.log("Server has started on port: " + port + "!");

//	In the event the server tries to disconnect, disconnect the connection
//	to the database too.
process.on('SIGTERM', function () {
	retriever.disconnect();
});

//	This handles the updating of database entries with a delay set.
var job = new CronJob('0 */' + retrieverDelay + ' * * * *', function() {
	retriever.update();	
}, null, true)
