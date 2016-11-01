var request = require('request');
var cheerio = require('cheerio');
var unfluff = require('unfluff');
var ProgressBar = require('progress');

var db = require('../database/db.js');

var fs = require('fs');

var chalk = require('chalk');

var URL = require('url').parse;

function Crawler(app, limit){
	this.ok = true;
	this.app = app;
	this.waiting = [];
	this.pool_limit = limit;
};
var crawler = Crawler;

Crawler.generateUUID = function generateUUID(){
	function s4(){
		return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
	}

	return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

Crawler.prototype.queue = function(links, fromId, theme){
	for(var l of links){
		this.waiting.push({
			link: l,
			parent: fromId,
			theme: theme,
		});
	}
	console.log(`Queued ${links.length} nodes, new length is ${this.waiting.length}`);
};

Crawler.prototype.pop = function(){
	this.waiting = this.waiting.slice(1);
};

Crawler.prototype.stop = function(){
	this.ok = false;
};

Crawler.prototype.continue = function(){
	this.pop();
	if(this.waiting.length === 0){
		return this.app.websockets.broadcast(JSON.stringify({
			message: 'END'
		}));
	}

	this.crawl(null, this.waiting[0].theme, this.waiting[0].parent);
};	

Crawler.prototype.crawl = function(links, theme, previousLinkId, firstTime){
	if(firstTime){
		this.waiting = [];
	}
	console.log('New crawl wave');
	var parent = this;

	if(!this.ok){
		return;
	}
	var link_counter = (firstTime) ? links.length : this.pool_limit;
	var pool = link_counter;


	for(var i = 0 ; i < pool; i++){
		var link = null;
		if(firstTime && links[i]){
			link = {
				link: links[i]
			};
		} else if (firstTime && !links[i]){
			break;
		} else {
			link = parent.waiting[i];
		}

		if(db.findNode(link.link)){
			link_counter--;
			console.log('\t\t\tDiminished because already found:', link_counter);
			if(link_counter === 0){
				console.log('Calling CONTINUE');
				parent.continue();
			}
			continue;
		}

		console.log(`\tCrawling ${link.link}`);

		this.get(link.link, theme, (function(currentLink, parentLinkId, parent, progress){
			return function(err, res){
				link_counter--;
				console.log('\t\t\tCounter', link_counter);
				if(err){
					if(firstTime){
						this.app.websockets.broadcast(JSON.stringify({
							error: {
								message: 'FIRST_HOST_UNREACHABLE',
								code: 101
							}
						}));
					}
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
						ct : theme.dictionary.ct,
						potential:  res.links.length,
					}, 
					edges: []
				};
				console.log("le node a un score de : ",result.node.score);
				db.addNode(result.node.id, result.node.name, result.node.link, {
					crawl: result.node.crawl,
					score: result.node.score,
					theme: result.node.theme,
					potential: result.node.potential
				});

				if(parentLinkId){
					result.edges.push({
						from: parentLinkId,
						to: result.node.id,
						weight:1,
						color: {
							inherit: 'to'
						},
						arrows: {
							to: {
								enabled: true
							}
						},
						params: {
							principal: true,
							theme : true
						}
					});
					db.addEdge(parentLinkId, result.node.id);
				}

				for(var l of res.links){
					var n = db.findNode(l);
					if(n){
						
						if(!result.node.theme && !n.theme)
						{
							result.edges.push({
								from: result.node.id,
								to: n.id,
								weight: 1,
								color: {
									inherit: 'to'
								},
								arrows: {
									to: {
										enabled: true
									}
								},
								params: {
									principal : false,
									theme : false
								}
							});
						}
						else{
							result.edges.push({
								from: result.node.id,
								to: n.id,
								weight: 1,
								color: {
									inherit: 'to'
								},
								arrows: {
									to: {
										enabled: true
									}
								},
								params: {
									principal : false,
									theme : true
								}
							});
						}
						
						db.addEdge(result.node.id, n.id);
					}
				}

				if(res.theme){
					// add to DB, 
					result.node.theme = true;
				}

				try{
					db.save();
				} catch(e) {
					console.error('ERROR saving db:', e);
				}

				parent.app.websockets.broadcast(JSON.stringify(result));

				if(res.crawl && res.links.length > 0){
					parent.queue(res.links, result.node.id, theme);	
				}

				if(link_counter === 0){
					console.log('Calling CONTINUE');
					parent.continue();
				}

				return;
			}
		})(link.link, previousLinkId, parent));
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
		},
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

			// check links to see if they are different
			var links = [];
			principal_url = URL(principal_url);

			for(var l of regex_links){				
				var link = URL(l);
				if(link.hostname === principal_url.hostname && link.pathname === principal_url.pathname){
					// auto redir
					// add link in graph ?
					continue;
				}
				links.push(l);
			};
			// we do not pass language 
			// crawler can be in any language
			var html = unfluff(body);
			
			var comp = theme.compare(html.text,own_url.href);
			var results = {
				theme: comp >= theme.dictionary.tt,
				crawl: comp >= theme.dictionary.ct,
				score: comp,
				links: links,
				name: html.title,
			};
			return callback(null, results);
		}
	})(url));
};

module.exports = crawler;