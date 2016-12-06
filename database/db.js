var URL = require('url').parse;
var fs = require('fs');

function generateUUID(){
	function s4(){
		return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
	}

	return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

Object.defineProperty(Array.prototype, 'findObjectByProperty', {
	value: function(prop, val){
		for(var el of this){
			if(el[prop] === val){
				return el;
			}
		}
		return null;
	}
});

class Node{
	constructor(id, name, link, params){
		this.id = id;
		this.name = name;
		this.link = link;
		if(params){
			this.extra = params;
		}
	}
}

class Edge{
	constructor(from, to, params){
		this.id = '';
		this.from = from;
		this.to = to;

		if(params){
			this.extra = params;
		}
	}
}

class DataBase{
	constructor(){
		this.objects = {
			Nodes: [],
			Edges: []
		};
		this.id = generateUUID();
	}
}

DataBase.prototype.addNode = function(id, name, link, extra){
	this.objects.Nodes.push(new Node(id, name, link, extra));
};

DataBase.prototype.addEdge = function(from, to, params){
	var f = this.objects.Nodes.findObjectByProperty('id', from);
	var t = this.objects.Nodes.findObjectByProperty('id', to);
	if(t && f){
		this.objects.Edges.push(new Edge(from, to, params));
	} else {
		throw new Error('Node does not exist', from, to);
	}
};

DataBase.prototype.findNode = function(link){
	link = URL(link);
	for(var node of this.objects.Nodes){
		var l = URL(node.link);
		if(l.hostname === link.hostname && l.pathname === link.pathname){
			return node;
		}
	}
	return null;
};

DataBase.prototype.getNode = function(id){
	return this.objects.Nodes.findObjectByProperty('id', id);
};

DataBase.prototype.save = function(){
	fs.writeFileSync('./nodes.json', JSON.stringify(this.objects));
};

DataBase.prototype.load = function(){
	try{
		this.objects = JSON.parse(fs.readFileSync('./nodes.json'));
	} catch(e) {
		console.error(e);
		throw e;
	}
};

DataBase.prototype.clear = function(){
	this.objects = {
		Nodes: [],
		Edges: []
	};
};


module.exports = DataBase;