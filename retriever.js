//	Retriever.js
//	This class implements the database aspect of the server. This class handles
//	the database itself, the retrieving of database entries and the actual
//	recording of database entries for use with the server HTML page.

//	This is the URL for MongoLAB.
var databaseURL = "mongodb://Imvoo:imvoo@ds049467.mongolab.com:49467/imvoo";

//	Initialization of starting variables.
//	Note that haveLoggedEmpty tracks if the program has debugged a 'No songs to record!'
//	message before, and if it has it won't spam the log with more of those messages.
var cheerio = require('cheerio'),
	request = require('request'),
	mongoose = require('mongoose'),
	async = require('async'),
	moment = require('moment');
var collection = 'listings';
var Listing = mongoose.model(collection, { datePlayed: Date, songName: String, 
	songLink: String, songDifficulty: String, score: String, rank: String, songMods: String });
var avatarURL = "https://s.ppy.sh/a/";
var haveLoggedEmpty = false;
var allScoresRegex = /(\d*,?){0,4} \(\w*\) (\w*,?){0,5}/g;
var scoresRegex = /^(\d*,?){0,4}/;
var ranksRegex = /\w*(?=\))/;

//	TODO: Change this to the Osu! API.
var url = "http://osu.ppy.sh/pages/include/profile-history.php?u=949789&m=0";

//	TODO: Store the user image somewhere.
//	Grabs the user's avatar from the Osu servers.
exports.getAvatar = function (userID, cb) {
	userAvatar = avatarURL + userID;
	cb();
}

//	Starts up the connection to the database, needed before any other
//	functions below can work.
exports.connect = function() {
	mongoose.connect(databaseURL, { keepAlive: 1 });
}

//	Disconnects the connection to the database, primarily used at the time the server
//	closes/restarts.
exports.disconnect = function() {
	mongoose.disconnect();
}

//	TODO: Allow for a number of entries to be grabbed, not all of them.
//	Returns all the scores that had been recorded for the user, for use with
//	the HTML page. It also sorts the scores so the most recently played song is
//	displayed first.
exports.retrieveRecent = function(cb) {
	return Listing.find({}).sort("-datePlayed").exec(cb);
}

//	TODO: Change this to use the Osu! API.
//	Updates the database with the recently played songs of the user.
//	It does this currently by grabbing the Recently Played (last 24 hours)
//	songs off the Osu! page every 5 minutes.
exports.update = function() {
	
	// 	Handles the score aspect of the entries, as the scores
	//	in the HTML page are not enclosed off with any div tags or any tags
	//	at all, so Regex is used to handle them.
	var allScores;
	var scores;
	var ranks;
	var mods;

	//	Requests the user's Recently Played page so that the recording can begin.
	//	console.log("Starting recording function!"); // DEBUG
	request(url, function (error, response, html) 
	{
		//	Tracks the current song being recorded, so that the loop can end.
		var count = 0;

		allScores = html.match(allScoresRegex);

		if (!error && response.statusCode == 200) 
		{
			//	TODO: Only receive the 'date' aspect of the listing.
			//	Finds the latest entry in the database so that it can compare the
			//	times recorded. This is used to only record songs that haven't been
			// 	recorded as of yet.
			// 	console.log("Found page to record!"); // DEBUG
			Listing.findOne({}).sort("-datePlayed").exec(function(err, result) {
				if (err)
				{
					console.log("Error in retrieving recent listing for saving entries!");
					callback();
				}

				if (result == null)
				{
					console.log("Error grabbing recent listing: there are no songs
						to grab!");
					console.log("Continuing on by recording all songs!");
					result = new Listing({ datePlayed: 0 });
				}

				var $ = cheerio.load(html);
				// 	console.log("Loaded HTML with Cheerio!"); // DEBUG

				//	Checks if there actually are any songs to be recorded.
				if ($('time.timeago').length == 0)
				{
					if (!haveLoggedEmpty)
					{
						console.log("No songs to record!");
						haveLoggedEmpty = true;
					}

					callback();
				}
				else
					haveLoggedEmpty = false;

				//	Iterates through each song entry and determines whether or not
				//	it should be recorded.
				$('time.timeago').each(function(i, element) 
				{
					var nextTag;
					var name;
					var difficulty;
					var link;
					var newSong;
					var date = this.text();

					//	Checks if the song has already been recorded by comparing
					//	dates played.
					if (result != null && (moment(date).isBefore(result.datePlayed) || moment(date).isSame(result.datePlayed)))
					{
						count++;
						// console.log("Already recorded, skipping!");
						// console.log(moment(date).diff(result.datePlayed));

						if ($('time.timeago').length == count)
							callback();
						return;
					}

					//	Extracts the information from the HTML page for the
					//	database entries.
					nextTag = this.next().text();
					name = nextTag.substr(0, nextTag.indexOf('[') - 1);
					difficulty = nextTag.substr(nextTag.indexOf('[') + 1, nextTag.length - nextTag.indexOf('[') - 2);
					link = "http://osu.ppy.sh" + this.next().attr('href');

					//	Extracts the score part of the database entry by cycling
					//	through the Regex.
					scores = allScores[i].match(scoresRegex);
					ranks = allScores[i].match(ranksRegex);
					mods = allScores[i].substring(allScores[i].lastIndexOf(' ') + 1);

					console.log("Preparing to record: " + name + " " + scores[0] + " " + ranks[0] + " on " + difficulty + " difficulty with these mods: " + mods);

					//	Combines the entries into a single model for the MongoDB
					//	database and records it to the database.
					newSong = new Listing({ datePlayed: date, songName: name, songLink: link, songDifficulty: difficulty, score: scores[0], rank: ranks[0], songMods: mods });
					newSong.save(function (err) 
					{
						count++;
						if (err)
							console.log("Error in saving!");
						else
							// console.log("Saved entry!");

						if ($('time.timeago').length == count)
							callback();
					});
				});
			});
		}
		//	Occurs if the HTML cannot be retrieved (internet errors, page is down).
		else
		{
			console.log("Error getting page!");
			callback();
		}
	});
}
