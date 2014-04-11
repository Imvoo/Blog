var express = require('express'),
	mongoose = require('mongoose');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/public/jade');
app.use(express.static(__dirname + '/public'));

var databaseURL = "mongodb://Imvoo:imvoo@ds049467.mongolab.com:49467/imvoo";
var collection = "listings";
mongoose.connect(databaseURL);
var Listing = mongoose.model(collection, { datePlayed: Date, songName: String, songLink: String, songDifficulty: String, score: String, rank: String, songMods: String });
var date = new Date();

var port = 5000;

app.get('/', function(req, res) 
{
	Listing.find({}).sort("-datePlayed").exec(function(err, listings)
	{
		res.render('layout', 
			{ listings: listings, date: date }
			);
	});
});

app.listen(port);
console.log("Server has started on port: " + port + "!");
