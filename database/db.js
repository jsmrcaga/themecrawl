var db = {};
var URL = require('url').parse;
var fs = require('fs');

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

db.objects = {
	Nodes: [],
	Edges: []
};

db.addNode = function(id, name, link, extra){
	db.objects.Nodes.push(new Node(id, name, link, extra));
};

db.addEdge = function(from, to, params){
	var f = db.objects.Nodes.findObjectByProperty('id', from);
	var t = db.objects.Nodes.findObjectByProperty('id', to);
	if(t && f){
		db.objects.Edges.push(new Edge(from, to, params));
	} else {
		throw new Error('Node does not exist', from, to);
	}
};

db.findNode = function(link){
	link = URL(link);
	for(var node of db.objects.Nodes){
		var l = URL(node.link);
		if(l.hostname === link.hostname && l.pathname === link.pathname){
			return node;
		}
	}
	return null;
};

db.getNode = function(id){
	return db.objects.Nodes.findObjectByProperty('id', id);
};

db.save = function(){
	fs.writeFileSync('./nodes.json', JSON.stringify(db.objects));
};

db.load = function(){
	try{
		db.objects = JSON.parse(fs.readFileSync('./nodes.json'));
	} catch(e) {
		console.error(e);
		throw e;
	}
};


module.exports = db;