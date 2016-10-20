var request = require('request');
var cheerio = require('cheerio');
var unfluff = require('unfluff');

var db = require('../database/db.js');

var fs = require('fs');

var chalk = require('chalk');

var URL = require('url').parse;

function Crawler(app){
	this.ok = true;
	this.app = app;
	this.waiting = [];
};
var crawler = Crawler;

Crawler.generateUUID = function generateUUID(){
	function s4(){
		return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
	}

	return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

Crawler.prototype.queue = function(links, fromId){
	this.waiting.push({
		links: links,
		parent: fromId,
		counter: links.length
	});
};

Crawler.prototype.stop = function(){
	this.ok = false;
};

Crawler.prototype.crawl = function(links, theme, previousLinkId){
	for(var link of links){
		if(!this.ok){
			break;
		}

		if(db.findNode(link)){
			continue;
		}

		var parent = this;
		console.log(chalk.green('Launching crawl for'), link);
		this.get(link, theme, (function(currentLink, parentLinkId){
			return function(err, res){
				if(err){
					return;
				}

				var result = {
					node: {
						id: Crawler.generateUUID(),
						label: res.name,
						link: currentLink,
						score: res.score,
						theme: res.theme || false,
						crawl : res.crawl || false,
						potential:  res.links.length,
						borderWidth:7,
						shape: 'dot',
						font: {
							face: 'Oswald',
							color: '#FFF'
						}
					}, 
					edges: []
				};

				db.addNode(result.node.id, result.node.name, result.node.link, {
					crawl: result.node.crawl,
					score: result.node.score,
					theme: result.node.theme,
					potential: result.node.potential
				});

				if(parentLinkId){
					result.edges.push({
						from: parentLinkId,
						to: result.node.id
					});
					db.addEdge(parentLinkId, result.node.id);
				}

				for(var l in res.links){
					var n = db.findNode(l);
					if(n){
						result.edges.push({
							from: result.node.id,
							to: n.id
						});

						db.addEdge(result.node.id, n.id);
					}
				}

				if(res.theme){
					// add to DB, 
					result.node.theme = true;
				}

				try{
					db.save();
					console.log(chalk.bgBlue("DB SAVED"));
				} catch(e) {
					console.error('ERROR saving db:', e);
				}

				// must be called last for maximum use of real-time
				if(res.crawl && res.links.length > 0){
					parent.app.websockets.broadcast(JSON.stringify(result));
					parent.crawl(res.links, theme, result.node.id);
				}

				return;
			}
		})(link, previousLinkId));
	}
};

Crawler.prototype.get = function(url, theme, callback){
	if(!this.ok){
		callback(null, null);
		return;
	}

	var options = {
		url: url,
		agent: false,
		headers:{
			'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36',
		}
	};

	request(options, (function(principal_url){
		return function(err, res, body){
			if(err){
				// send error via websocket
				console.error(url, err);
				callback(err, null);
				return;
			}

			var own_url = (URL(url));
			var host = own_url.hostname;

			// get links
			var link_regex = /href="([^"]*)"/gi;

			var hreg = {};
			hreg.protocol = /^\/\//i;
			hreg.autodir = /^\/[^\/#]/i;

			var href_regex = link_regex.exec(body);
			var regex_links = [];
			while(href_regex){
				// TODO check if link is redir, autodir, no-protocol etc...
				if(hreg.protocol.test(href_regex[1])){
					regex_links.push(own_url.protocol + href_regex[1]);
				} else if(hreg.autodir.test(href_regex[1])){
					regex_links.push(own_url.protocol + '//' + own_url.host + href_regex[1]);
				}
				href_regex = link_regex.exec(body);
			}

			
			// todo : delete same links, but add as reference!!!!
			console.log('Site has', regex_links.length, 'links');
			// check links to see if they are different
			var links = [];
			principal_url = URL(principal_url);

			for(var l of regex_links){				
				var link = URL(l);
				if(link.host === principal_url.host && link.pathname === principal_url.pathname){
					// auto redir
					// add link in graph ?
					continue;
				}
				links.push(l);
			};
			// we do not pass language 
			// crawler can be in any language
			var html = unfluff(body);
			var comp = theme.compare(html.text);
			var results = {
				theme: comp >= theme.dictionary.tt,
				crawl: comp >= theme.dictionary.ct,
				score: comp,
				links: links,
				name: html.title,
			};
			callback(null, results);
			return;
		}
	})(url));
};

module.exports = crawler;