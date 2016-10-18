// Mining the Web - 
	// Moteurs de recherche:
		// TEOMA
		// NORTHERN LIGHT
var express = require('express');
var app = express();

var WebSocketServer = require('ws').Server;

var wss = WebSocketServer({port: process.env.PORT});
wss.broadcast = function(message){
	wss.clients.forEach(function(ws){
		ws.send(message);
	})
};
var ws_app = {
	websockets : wss,
};

var Crawler = require('./crawler/crawler.js');
var crawler = new Crawler(ws_app);

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
});

app.get('/crawl', function(req, res, err){
	crawler.crawl(req.params.url, req.params.theme);
	res.sendStatus(200);
});

app.post('/threshold', function(req, res, err){
	// update thresholds
});

app.listen(process.env.PORT, function(){
	console.log('Server listening!');
});