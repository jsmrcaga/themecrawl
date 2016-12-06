// Mining the Web - 
	// Moteurs de recherche:
		// TEOMA
		// NORTHERN LIGHT
var express = require('express');
var app = express();
var http = require('http');

var ThemeManager = require('./models/themeManager.js');
ThemeManager.loadThemes();

var server = http.createServer(app);
var WebSocketServer = require('ws').Server;

var wss = WebSocketServer({server: server});
wss.on('connection', function(ws){
	if(!ws.upgradeReq.headers.cookie){
		ws.send(JSON.stringify({error:{code: 403}}));
		ws.close();
	}

	var [t, token] = ws.upgradeReq.headers.cookie.split('=');
	var crawler = CrawlerManager.getCrawler(token);
	if(!crawler){
		ws.send(JSON.stringify({error:{code: 404}}));
		ws.close();
	} else {
		crawler.crawler.websocket = ws;
	}
});

var mcounter = 0;
wss.broadcast = function(message){
	wss.clients.forEach(function(ws){
		ws.send(message, function ack(err){
			if(err){
				console.error('WS SEND MESSAGE FAILED', err);
			}
		});
	});
	mcounter++;
};
var ws_app = {
	websockets : wss,
};

var Crawler = require('./crawler/crawler.js');
var CrawlerManager = require('./crawler/CrawlerManager.js');

var themator = require('./crawler/themator.js');


var bodyParser = require('body-parser');
var cors = require('cors');
app.use(cors());

app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mustache = require('mustache-express');
app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', __dirname+'/views');
app.use(express.static(__dirname+'/views/public'));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use('/', function(req, res, next){
	if(req.path === '/'){
		return next();
	}
	if(!req.cookies.token){
		return res.status(400).json({error:{message: 'Cookie required'}});
	}
	return next();
})

app.get('/', function (req, res, err){
	var crawler = new Crawler();
	var token = Crawler.generateUUID();
	CrawlerManager.addCrawler(crawler, token)
	res.cookie('token', token).render('index');
});

app.post('/theme', function(req, res, err){
	// create new theme
});

app.get('/stop', function(req, res, err){
	var crawler = CrawlerManager.getCrawler(req.cookies.token);
	if(!crawler){
		return res.sendStatus(404);
	} else {
		crawler.crawler.stop();
	}
	return res.status(200).json({action: 'waiting_for_stop'});
});

app.get('/themes', function(req, res, err){
	var t = ThemeManager.getThemesIds();
	return res.json(t);
});
app.post('/threshold', function(req, res, err){
	var t = ThemeManager.loadTheme(req.body.theme);
	return res.json(t);
});

app.post('/crawl', function(req, res, err){
	var theme = ThemeManager.loadTheme(req.body.theme);
	if(!theme){
		return res.sendStatus(400);
	}
	var crawler = CrawlerManager.getCrawler(req.cookies.token);
	if(!crawler){
		return res.sendStatus(404);
	} else {
		crawler = crawler.crawler;
	}

	if(crawler.init){
		res.status(200).json({crawling: true});
		return crawler.play();
	}
	// ThemeManager.setThreshold(theme.name,req.body.tt,req.body.ct);
	console.log(`Begin crawling ${theme.name} with thresholds`, theme.dictionary.tt, theme.dictionary.ct);
	crawler.pool_limit = req.body.max_connections;
	res.status(200).json({crawling: true});
	return crawler.crawl(req.body.urls, theme, null, true);
});

app.post('/threshold', function(req, res, err){
	// update thresholds
});

app.post('/test', function(req, res, err){
	// tests a theme against a website
});

app.post('/calibrate', function(req, res, err){
	// takes a list of words weighted 1, and 
	// calibrates the weights according to a
	// given website, based on word frequency
});


app.get('/reset',function(req,res,err){
	//stop the crawler first
	token = req.cookies.token;
	crawler = CrawlerManager.getCrawler(token);
	if(crawler!=null){
		crawler.crawler.stop_callback = function(){
			crawler.crawler.websocket.send(JSON.stringify({end_success : true}));
			crawler.crawler.waiting=[];
		};
		crawler.crawler.stop();
		res.sendStatus(200);
	}
	else {
		res.sendStatus(404);
	}

	//
	


});

app.post('/make', function(req, res, err){

  
  return themator.get(req.body.url, function(theme){
    if (theme) {
      res.status(200).json({created: true});
    } else {
      res.status(200).json({created: false});
    };
  });
});

server.listen(2217, function(){
	console.log(`Server listening! ${2217}`);
});
