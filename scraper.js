// htmlParser Test
var databaseURL = "mongodb://Imvoo:Imvoo@oceanic.mongohq.com:10035/imvoo_database";
var collection = 'listings';

var cheerio = require('cheerio'),
	request = require('request'),
  mongoose = require('mongoose');

var url = "http://osu.ppy.sh/pages/include/profile-history.php?u=949789&m=0";
var scoreRegex = /\d*,?\d*,?\d* \(\w*\) \w+,?\w*,?\w*,?\w*,?\w*/g;

mongoose.connect(databaseURL);
var Listing = mongoose.model(collection, { datePlayed: Date, songName: String, songLink: String, songDifficulty: String, score: String });

request(url, function (error, response, html) 
{
  if (!error && response.statusCode == 200) 
  {
  	var $ = cheerio.load(html);

  	$('time.timeago').each(function(i, element) 
    {
      var amount = $('time.timeago').length;
  		var nextTag = this.next().text();
  		var date = this.text();
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
        if (err)
          console.log("Error in saving!");
        else
          console.log("Saved entry!");

        if (amount == i + 1)
          mongoose.disconnect();
      });
		});
	}
});
