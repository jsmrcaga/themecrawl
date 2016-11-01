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
		Workshop.ajax({
			url: 'http://' + location.host + '/crawl',
			method: 'POST',
			data: {
				urls: entry_links,
				theme: 'Poliovirus',
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
})();