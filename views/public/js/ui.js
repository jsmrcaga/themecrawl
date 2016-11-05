;(function(){
	function getEntryPoints(){
		// var http_regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/i ;
		var entries = document.querySelectorAll('.entry_link');
		var plp = [];
		for(var i = 0; i < entries.length; i++){
			// if(http_regex.test(entries[i].value)){
				plp.push(entries[i].value);
				entries[i].style.borderStyle = 'none';
			// } else {
			// 	entries[i].style.borderWidth = '1px';
			// 	entries[i].style.borderStyle = 'solid';
			// 	entries[i].style.borderColor = 'red';
			// }
		}
		return plp;
	}

	document.querySelector('#crawl_button').addEventListener('click', function(){
		var entry_links = getEntryPoints();
		if(document.querySelector("#threshold_theme").value==''){
			document.querySelector("#threshold_theme").value=0;
		}
		if(document.querySelector("#threshold_crawler").value==''){
			document.querySelector("#threshold_crawler").value=0;
		}
		Workshop.ajax({
			url: 'http://' + location.host + '/crawl',
			method: 'POST',
			data: {
				urls: entry_links,
				theme: document.querySelector('#theme_selector').value,
				tt : document.querySelector("#threshold_theme").value,
				ct : document.querySelector("#threshold_crawler").value,
				max_connections: 10
			},
			rh: {
				'Content-Type': 'application/json'
			}
		}, function(err, res){
			console.log(res);
		});
	});

	document.querySelector('#stop_crawl_button').addEventListener('click', function(){
		Workshop.ajax({
			url: 'http://' + location.host + '/stop',
			method: 'GET',
		}, function(err, res){
			console.log(res);
		});
	});

	document.querySelector('#new_entry').addEventListener('click', function(){
		var div = document.createElement('div');
		div.classList.add('entry');

		var input_field = document.createElement('div');
		input_field.className = 'input-field col s6';
		div.appendChild(input_field);

		var input = document.createElement('input');
		input.placeholder = 'Link';
		input.classList.add('entry_link');
		input_field.appendChild(input);

		document.querySelector('.entry-points').appendChild(div);
	});

	document.querySelector('#theme_selector').addEventListener('change', function(){
		console.log(document.querySelector('#theme_selector').value);
		Workshop.ajax({
			url:'http://' +location.host + '/threshold',
			method:'POST',
			data : {
				theme : document.querySelector('#theme_selector').value
			},
			rh: {
				'Content-Type': 'application/json'
			}
		}, function(err, res){
			try{
				res = JSON.parse(res);
				console.log(res);
				document.querySelector('#threshold_theme').value=res.dictionary.tt;
				document.querySelector('#threshold_crawler').value=res.dictionary.ct;

			} catch(e) {
				console.error(e);
			}
			});
	});

	function initSelector(){
		var selector = document.querySelector('#theme_selector');
		selector.innerHTML = '';

		Workshop.ajax({
			url: 'http://' + location.host + '/themes',
			method: 'GET'
		}, function(err, res){
			try{
				res = JSON.parse(res);
			} catch(e) {
				console.error(e);
			}

			for(var t of res){
				var option = document.createElement('option');
				option.value = t;
				option.innerHTML = t;
				console.log(option);
				selector.appendChild(option);
			}
			
			//$('select').material_select();
		});
	}

	initSelector();
})();