var models = {};

class Word{
	constructor(word, weight){
		this.word = word;
		this.weight = weight;
	}
}
models.Word = Word;

class Dictionary{
	constructor(words, themeThreshold, crawlThreshold){
		this.words = words;
		this.tt = themeThreshold;
		this.ct = crawlThreshold;
	}

	compare(text){
		var score = 0;
		for(var word of this.words){
			var reg = new RegExp('\\b'+word.word+'\\b', 'gi');
			while(reg.test(text)){
				score += word.weight;
			}
		}
		return score;
	}
}
models.Dictionary = Dictionary;

class Theme{
	constructor(name, dictionary){
		this.name = name;
		this.dictionary = dictionary;
	}

	compare(text){
		return this.dictionary.compare(text);
	}
}
models.Theme = Theme;

module.exports = models;