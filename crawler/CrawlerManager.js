var CrawlerManager = {
	crawlers : []
};

CrawlerManager.addCrawler = function(crawler, token){
	this.crawlers.push({
		crawler: crawler,
		token: token
	});
	console.log('CM: added new crawler', token);
};

CrawlerManager.killCrawler = function(token){
};

CrawlerManager.getCrawler = function(token){
	for(var c of this.crawlers){
		if(c.token === token){
			return c;
		}
	}
	return null;
};

module.exports = CrawlerManager;