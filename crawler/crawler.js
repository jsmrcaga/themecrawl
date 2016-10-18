var request = require('request');
var cheerio = require('cheerio');
var unfluff = require('unfluff');

function Crawler(app, database){
	this.ok = true;
};
var crawler = Crawler;

Crawler.generateUUID = function generateUUID(){
	function s4(){
		return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
	}

	return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

Crawler.prototype.stop = function(){
	this.ok = false;
};

Crawler.prototype.crawl = function(links, theme){
	for(var link of links){
		if(!this.ok){
			break;
		}

		this.get(link, theme, (function(currentLink, numberOfHrefs){
			return function(err, res){
				if(err){
					return;
				}

				var result = {
					node: {
						id: Crawler.generateUUID(),
						name: currentLink,
						score: res.score,
						theme: false,
						crawl : false,
						potential:  numberOfHrefs
					}
				};

				if(res.theme){
					// add to DB, 
					result.node.theme = true;
				}

				// must be called last for maximum use of real-time
				if(res.crawl){
					result.node.crawl = true;
					app.websockets.broadcast(JSON.stringify(result));
					this.crawl(res.links, theme);
				}
			}
		})(link, links.length));
	}
};

Crawler.prototype.get = function(url, theme, callback){
	if(!this.ok){
		return callback(null, null);
	}

	var options = {
		url: url,
		headers:{
			'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36',
		}
	};

	request(options, (function(principal_url){
		return function(err, res, body){
			if(err){
				// send error via websocket
				console.error(url, err);
				return callback(err, null);
			}

			var host = (new URL(url)).hostname;

			var $ = cheerio.load(body);
			// todo : delete same links, but add as reference!!!!
			var raw_links = $('a');
			// check links to see if they are different
			var links = [];
			principal_url = new URL(principal_url);
			for(var l of raw_links){
				var link = new URL(l.href);

				if(l in db){
					// add link in graph
					continue;
				}

				if(link.host === principal_url.host && link.pathname === principal_url.pathname){
					// auto redit
					// add link in graph
					continue;
				}

			}

			// we do not pass language 
			// crawler can be in any language
			var text = unfluff(body);

			var comp = theme.compare(text);
			var results = {
				theme: comp >= theme.dictionary.tt,
				crawl: comp >= theme.dictionary.ct,
				score: comp,
				links: links
			};

			return callback(null, results);
		}
	})(url));
};

module.exports = crawler;