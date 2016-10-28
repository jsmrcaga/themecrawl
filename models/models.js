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

	compare(text,url){
		var score = 0;

		/*
		The average number of letters in a word in the french
		dictionary is about 5.07

		The average length of a website is 600 words.
		Above this quantity we do not 
		read more than 20% of the whole information

		We can considerate this threshold as our baseline :
		- if a page has more than 600 words then the scores
		 of the words of this page are reduced
		on the other side, if a page has less than 600 words
		 the scores of the words of this page are emphasized. For example :
			- if a page has 1200 words, then the page rank is two
			- if a page has 300 words, then the page rank is 0.5

		We also consider that a word existing in the URL three times as important
		as if it wasn't

		*/

		var page_rank = (text.length/5.07)/600;
		for(var word of this.words){
			var reg = new RegExp('\\b'+word.word+'\\b', 'gi');
			while(reg.test(text)){
				score += (word.weight)/page_rank;
			}
			var reg_url = new RegExp(word)
			if(reg.test(url))
			{
				score += (word.weight*3)/page_rank;
			}
		}
		console.log("score de cette page : ",score);
		
		return score;
	}
}
models.Dictionary = Dictionary;

class Theme{
	constructor(name, dictionary){
		this.name = name;
		this.dictionary = dictionary;
	}

	compare(text,url){
		return this.dictionary.compare(text,url);
	}
}
models.Theme = Theme;

module.exports = models;