var ThemeManager = {};

var models = require('./models.js');

var fs = require('fs');

ThemeManager.themes = [];

function ThemeFactory(data){
	var t = new models.Theme(data.name);
	var d = new models.Dictionary(data.dictionary.words, data.dictionary.tt, data.dictionary.ct);
	t.dictionary = d;
	return t;
}

// noms toujours en ANGLAIS
ThemeManager.loadThemes = function(){
	var data = null;
	try {
		// on utilise la methode SYNCRHONE
		// c'est un chargement de config au debut
		// du programme
		data = fs.readFileSync( __dirname +'/dico.json', 'utf8');
		data = JSON.parse(data);
		for(var t of data){
			ThemeManager.themes.push(ThemeFactory(t));
		}
	} catch(e) {
		console.error('Erreur chargement json', e);
	}

};

ThemeManager.loadTheme = function(id){

	for(var i=0;i<ThemeManager.themes.length;i++)
	{
		// indentation!!
		if(ThemeManager.themes[i].name===id)
		{
			return ThemeManager.themes[i];
		}
	
	}
	console.error('Theme non trouvé');
	// retourner une valeur quand meme
	// histoire de pouvoir comparer 
	// quand on utilise la methode
	// ex: (if(TM.loadTheme(5) == null))...
	return null;
};

ThemeManager.newTheme = function(name, dict, tt, ct){
	var t = new models.Theme(name);
	var d = new Dictionary(dict, tt, ct);
	t.dictionary = d;
	ThemeManager.themes.push(t);
	return t;
};



module.exports = ThemeManager;
