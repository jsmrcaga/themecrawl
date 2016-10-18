var ThemeManager = {};


var models = require('./models.js');

var fs = require('fs');

ThemeManager.themes = [];


ThemeManager.chargerJson = function(){
    fs.readFile('./dico.json', 'utf8', function (err, data) {
	if (err)
	{
	    console.log('Erreur chargement json');
	    return;
	}
	else
	{
	    console.log('Json charge');
	    ThemeManager.themes = JSON.parse(data);
	}
	
    }
	       )}

ThemeManager.loadTheme = function(id){

    for(var i=0;i<ThemeManager.themes.length;i++)
    {
	if(ThemeManager.themes[i].name==id)
	{
	    return ThemeManager.themes[i];
	}
	
    }
    console.log('Theme non trouvé');
    return;
};



module.exports = ThemeManager;
