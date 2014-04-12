// This is the URL for MongoHQ.
// var databaseURL = "mongodb://Imvoo:Imvoo@oceanic.mongohq.com:10035/imvoo_database";

// This is the URL for MongoLAB.
var databaseURL = "mongodb://Imvoo:imvoo@ds049467.mongolab.com:49467/imvoo";
var collection = 'listings';

var cheerio = require('cheerio'),
	request = require('request'),
	mongoose = require('mongoose'),
	async = require('async'),
	moment = require('moment');

var url = "http://osu.ppy.sh/pages/include/profile-history.php?u=949789&m=0";
var allScoresRegex = /(\d*,?){0,4} \(\w*\) (\w*,?){0,5}/g;
var allScores;
var scoresRegex = /^(\d*,?){0,4}/;
var scores;
var ranksRegex = /\w*(?=\))/;
var ranks;
var mods;

var Listing = mongoose.model(collection, { datePlayed: Date, songName: String, songLink: String, songDifficulty: String, score: String, rank: String, songMods: String });
mongoose.connect(databaseURL);

exports.disconnect = function() {
	mongoose.disconnect();
}

exports.retrieveRecent = function(cb) {
	return Listing.find({}).sort("-datePlayed").exec(cb);
}

exports.update = function() { 
	async.series([
		function(callback)
		{
			console.log("Starting recording function!"); // DEBUG
			request(url, function (error, response, html) 
			{
				var count = 0;
				if (!error && response.statusCode == 200) 
				{
					console.log("Found page to record!"); // DEBUG
					Listing.findOne({}).sort("-datePlayed").exec(function(err, result) {
						if (err)
						{
							console.log("Error in retrieving recent listing for saving entries!");
							callback();
						}

						if (result != null)
							console.log(result.datePlayed + " " + result.songName);

						var $ = cheerio.load(html);
						console.log("Loaded HTML with Cheerio!"); // DEBUG

						if ($('time.timeago').length == 0)
						{
							console.log("No songs to record!");
							callback();
						}

						$('time.timeago').each(function(i, element) 
						{
							var date = this.text();
							if (result != null && (moment(date).isBefore(result.datePlayed) || moment(date).isSame(result.datePlayed)))
							{
								count++;
								console.log("Already recorded, skipping!");
								console.log(moment(date).diff(result.datePlayed));

								if ($('time.timeago').length == count)
									callback();
								return;
							}

							var amount = $('time.timeago').length;
							var nextTag = this.next().text();
							var name = nextTag.substr(0, nextTag.indexOf('[') - 1);
							var difficulty = nextTag.substr(nextTag.indexOf('[') + 1, nextTag.length - nextTag.indexOf('[') - 2);
							var link = "http://osu.ppy.sh" + this.next().attr('href');

							allScores = allScoresRegex.exec(html);
							scores = scoresRegex.exec(allScores);
							ranks = ranksRegex.exec(allScores);
							mods = allScores[0].substring(allScores[0].lastIndexOf(' ') + 1);

							console.log("Preparing to record: " + name + " " + allScores[0] + " " + ranks[0] + " on " + difficulty + " difficulty with these mods: " + mods);

							var newSong = new Listing({ datePlayed: date, songName: name, songLink: link, songDifficulty: difficulty, score: scores[0], rank: ranks[0], songMods: mods });
							newSong.save(function (err) 
							{
								count++;
								if (err)
									console.log("Error in saving!");
								else
									console.log("Saved entry!");

								if ($('time.timeago').length == count)
									callback();
							});
						});
					});
				}
			})
		},

		function(callback)
		{
			console.log("Finished recording entries!");
			callback();
		}
	])
}
