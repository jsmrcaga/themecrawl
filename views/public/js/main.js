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
	data.node.borderWidth =7;
	data.node.shape = 'dot';
	data.node.font = {
		face: 'Oswald',
		color: '#FFF'
	};
	exec.data.nodes.add(data.node);
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
	}

	exec.data.edges.add(validated_edges);
};

init.start();