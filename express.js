var express = require('express'),
	mongoose = require('mongoose');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/public/jade');
app.use(express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 5000);

var CronJob = require('cron').CronJob;
var scraper = require('./scraper');

app.get('/', function(req, res) 
{
	scraper.retrieveRecent(function(err, listing)
	{
		res.render('layout', 
			{ listings: listing }
			);
	})
});

app.listen(port);
console.log("Server has started on port: " + port + "!");

process.on('SIGTERM', function () {
	scraper.disconnect();
});

var job = new CronJob('5 * * * * *', function() {
	scraper.update();	
}, null, true)
