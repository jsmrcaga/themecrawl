var request = require('request');
var cheerio = require('cheerio');
var unfluff = require('unfluff');
var ProgressBar = require('progress');

var db = require('../database/db.js');

var fs = require('fs');

var chalk = require('chalk');

var URL = require('url').parse;

var Themator = {};

var ignore = require('../models/irrevelevantWords.json');

Themator.get = function(url, callback){

  var options = {
    url: url,
    agent: false,
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36',
    },
  };

  request(options, function(err, res, body){
			if(err){
				// send error via websocket
				console.error("Error creating theme");
				callback(0);
				return;
			}
    var html = unfluff(body);
    var regex = /[ .,;'!?]/;
    html = html.text.split(regex);

    for(var val of html){
      if(ignore.indexOf(val.toLowerCase()) > -1)
      {html.splice(html.indexOf(val),1);
      }
    }
    html.map(function(element){element.trim();});

    var word = [];

    for(var val of html)
    {
      if(val!=''){
	word.push(val);
      }
    }
    
    console.log(word);
		  
		  //return callback(null, results);
  });

  
  console.log("Creating theme from "+url);
  callback(1);
	};

module.exports = Themator;
