// htmlParser Test
var databaseURL = "mongodb://Imvoo:Imvoo@oceanic.mongohq.com:10035/imvoo_database";
var collection = 'listings';

var cheerio = require('cheerio'),
	request = require('request'),
	mongoose = require('mongoose'),
	async = require('async'),
	moment = require('moment');

var url = "http://osu.ppy.sh/pages/include/profile-history.php?u=949789&m=0";
var scoreRegex = /\d*,?\d*,?\d* \(\w*\) \w+,?\w*,?\w*,?\w*,?\w*/g;
var scores;

mongoose.connect(databaseURL);
var Listing = mongoose.model(collection, { datePlayed: Date, songName: String, songLink: String, songDifficulty: String, score: String });

async.series([
	function(callback)
	{
		request(url, function (error, response, html) 
		{
			var count = 0;
			if (!error && response.statusCode == 200) 
			{
				Listing.findOne({}).sort("-datePlayed").exec(function(err, result) {
					if (result != null)
						console.log(result.datePlayed + " " + result.songName);

					var $ = cheerio.load(html);

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

						scores = scoreRegex.exec(html);
						console.log(date + " " + name);
						console.log(link);
						console.log(scores[0] + " " + difficulty);

						var newSong = new Listing({ datePlayed: date, songName: name, songLink: link, songDifficulty: difficulty, score: scores[0] });
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
		mongoose.disconnect();
		console.log("Disconnected!");
		callback();
	}
])
