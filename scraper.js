// htmlParser Test
var databaseURL = "mongodb://Imvoo:Imvoo@oceanic.mongohq.com:10035/imvoo_database";
var collections = ["Listings"];

var cheerio = require('cheerio'),
	request = require('request');
	db = require('mongojs').connect(databaseURL, collections);

var url = "http://osu.ppy.sh/pages/include/profile-history.php?u=949789&m=0";
var scoreRegex = /\d*,?\d*,?\d* \(\w*\) \w+,?\w*,?\w*,?\w*,?\w*/g;
var scores;

request(url, function (error, response, html) 
{
  if (!error && response.statusCode == 200) 
  {
  	var $ = cheerio.load(html);

  	$('time.timeago').each(function(i, element) 
    {
  		var nextTag = this.next().text();
  		var date = this.text();
  		var name = nextTag.substr(0, nextTag.indexOf('[') - 1);
  		var difficulty = nextTag.substr(nextTag.indexOf('[') + 1, nextTag.length - nextTag.indexOf('[') - 2);
  		var link = "http://osu.ppy.sh" + this.next().attr('href');
  		scores = scoreRegex.exec(html);
  		console.log(date + " " + name);
  		console.log(link);
  		console.log(scores[0] + " " + difficulty);

  		db.Listings.save({datePlayed: date, songName: name, songLink: link, songDifficulty: difficulty}, function(err, saved)
      {
        if (err || !saved)
        {
          console.log("Not Saved!");
        }
        else
        {
          console.log("User Saved!");
        }
      });
		});
	}
  else 
  {
    console.log("GET TO THE CHOPPA!");
  }
});
