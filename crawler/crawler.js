var crawler = {};

var request = require('request');

var cheerio = require('cheerio');

crawler.crawl = function(entry, theme){

};

crawler.get = function(url, theme, callback){
	var options = {
		url: url,
		headers:{
			'User-Agent':'',
		}
	};
	request(options, function(err, res, body){
		if(err){
			// send error via websocket
			console.error(url, err);
			return callback(err, null);
		}

		var host = (new URL(url)).hostname;

		var $ = cheerio.load(body);
		var links = $('a').filter(element => (new URL(element.href)).hostname !== host);

		var comp = theme.compare(body);
		var results = {
			theme: comp >= theme.dictionary.tt,
			crawl: comp >= theme.dictionary.ct,
			score: comp
		};

		return callback(null, res);
	});
};

module.exports = crawler;