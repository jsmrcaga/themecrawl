var exec = {};
exec.data = {};
var graph = {};

var init = {};

var COLORS = {
	theme : '#E76D83',
	not_theme: '#72A1E5'
};

init.graph = function initGraph(){
	var options = {};
	exec.graph = new vis.Network(document.getElementById('graph_container'), exec.data, options);
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
	exec.data.nodes.add(data.node);
	exec.data.nodes.update({id: data.node.id, color:{border: color}});

	exec.data.edges.add(data.edges);
};

init.start();