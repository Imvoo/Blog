var express = require('express');

var app = express();
app.use(express.compress());

app.set('view engine', 'jade');
app.set('views', __dirname + '/public/jade');
app.use(express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 5000);

var CronJob = require('cron').CronJob;
var retriever = require('./retriever');
var user = "949789";

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

app.listen(port);
console.log("Server has started on port: " + port + "!");

process.on('SIGTERM', function () {
	retriever.disconnect();
});

var job = new CronJob('1 * * * * *', function() {
	retriever.update();	
}, null, true)
