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
wss.on('connection', function(event){
	console.log('New connection!');
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
	console.log('MESSAGES: ', mcounter);
};
var ws_app = {
	websockets : wss,
};

var Crawler = require('./crawler/crawler.js');
var crawler = new Crawler(ws_app);

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


app.get('/', function (req, res, err){
	res.render('index');
});

app.post('/theme', function(req, res, err){
	// create new theme
});

app.get('/stop', function(req, res, err){
	crawler.stop();
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

	//theme.dictionary.ct = req.body.ct;
	//theme.dictionary.tt = req.body.tt;

	console.log(`Begin crawling ${theme.name} with thresholds`, theme.dictionary.tt, theme.dictionary.ct);
	res.status(200).json({crawling: true});
	crawler.pool_limit = req.body.max_connections;
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
