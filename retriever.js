var cheerio = require('cheerio'),
	request = require('request');

var url = "https://osu.ppy.sh/u/";

exports.getAvatar = function (userID, cb) {
	request(url + userID, function (error, response, html) {
		if (error)
			console.log(error);

		var $ = cheerio.load(html);

		if ($('img[alt]').length != 0 && $('img[alt]').attr('src') != "")
		{
			userAvatar = $('img[alt]').attr('src');
			cb();
		}
		else
		{
			userAvatar = '';
			console.log("WARN: Couldn't find user image!");
			cb();
		}
	});
}
