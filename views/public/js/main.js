var exec = {};
exec.data = {};
var graph = {};

var init = {};

var COLORS = {
	theme : '#E76D83',
	not_theme: '#72A1E5'
};

init.graph = function initGraph(){
	var options = {
		physics: {
			solver: 'forceAtlas2Based'
		}
	};
	exec.graph = new vis.Network(document.getElementById('graph_container'), exec.data, options);
	exec.graph.on('doubleClick', function(event){
		if(event.nodes.length === 0){
			return;
		}

		var node = exec.data.nodes.get(event.nodes[0]);
		console.log('opening', node.link);
		window.open(node.link);
	});

	exec.graph.on('click', function(event){
		if(event.nodes.length > 0){
			graph.hideNotNeighbors(event.nodes[0]);
		} else {

		}
	});
};

init.start = function initialize(){
	exec.data.nodes = new vis.DataSet();
	exec.data.edges = new vis.DataSet();
	init.graph();

	exec.ws = new WebSocket(`ws://${window.location.host}`);

	exec.ws.addEventListener('message', function(event){
		console.log('New Message!');
		try{
			message = JSON.parse(event.data);
		} catch(e){
			return console.error(message, e);
		}

		if(message.message && message.message === 'END'){
			alert('Fin du crawl');
		}
		if(message.end_success && message.end_success==true){
			graph.clear();
		}

		graph.build(message);
	});

	exec.ws.addEventListener('error', function(error){
		console.error(error);
		alert('WebSocket disconnected!');
	});
};


graph.build = function(data){
	data.node.color = {};
	var color = null;
	if(data.node.theme){
		color = COLORS.theme;
	} else {
		color = COLORS.not_theme;
	}

	if(data.node.score > data.node.tt){
		if(data.node.score-data.node.tt>1)
		{
			data.node.size =data.node.tt + ((data.node.score-data.node.tt)/Math.sqrt(data.node.score-data.node.tt))*Math.log(data.node.score-data.node.tt);
		}else{
			data.node.size =data.node.score;
		}
		
	} else {
		data.node.size=(data.node.ct/2);
	}

	data.node.borderWidth =7;
	data.node.shape = 'dot';
	data.node.font = {
		face: 'Oswald',
		color: '#FFF'
	};
	data.node.title= "score : "+data.node.score;
	exec.data.nodes.add(data.node);

	var crawled_counter = document.querySelector('#crawled_nodes_counter');
	var theme_counter = document.querySelector('#theme_nodes_counter');
	crawled_counter.innerHTML = parseInt(crawled_counter.innerHTML) + 1;
	if(data.node.theme){
		theme_counter.innerHTML = parseInt(theme_counter.innerHTML) + 1;		
	}

	exec.data.nodes.update({id: data.node.id, color:{border: color}});

	var validated_edges = [];
	for(var edge of data.edges){
		var exists_in_db = exec.data.edges.get({
			filter: function(item){
				return (item.from === edge.from &&
				item.to === edge.to);
			}
		});

		var exists_itself = false;
		for(var e of validated_edges){
			if(e.to === edge.to && e.from === edge.from){
				exists_itself = true;
				e.weight++;
			}
		}
		
		if(exists_in_db.length === 0 && !exists_itself){
			validated_edges.push(edge);
		} else if(exists_in_db.length != 0){
			exec.data.edges.update({
				id: exists_in_db[0].id,
				weight: exists_in_db[0].weight + 1
			});
		}

		if(!edge.params.theme){
			edge.hidden=true;
		}
	}

	exec.data.edges.add(validated_edges);
};

graph.clear = function(){
	exec.data.nodes.clear();
	exec.data.edges.clear();

};

graph.hideNotNeighbors = function(id){
	var nodes_to_hide = exec.data.nodes.get({
		filter: function(element){
			return element.from !== id;
		}
	});

	var n = [];
	for(var el of nodes_to_hide){
		n.push({
			id: el.id,
			color: {
				opacity: 0.2
			}
		});
	}

	exec.data.nodes.update(n);
};



init.start();