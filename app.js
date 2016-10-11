// Mining the Web - 
	// Moteurs de recherche:
		// TEOMA

var express = require('express');
var app = express();

var crawler = require('./crawler/crawler.js');

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
	
});

app.listen(1234, function(){
	console.log('Server listening!');
});