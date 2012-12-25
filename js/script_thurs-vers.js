var apiKey = '086eaa6fe5c287a37b6e25a09586e7a9';

// http://words.bighugelabs.com/api/2/086eaa6fe5c287a37b6e25a09586e7a9/ /json


function posTester(word){
  var wordtest = new Lexer().lex(word);
  var taggedWords = new POSTagger().tag(wordtest);
  var tag = taggedWords[0][1];
  return tag;
}

function cleanBlacklist( word ) {
  var tag = posTester(word);
  if(($.inArray(tag, posBlacklist) == -1  ) && ($.inArray(word.toLowerCase(), wordBlacklist) == -1  )) {
     return word;
  }
}



function isUpperCase( word ) {
  return (/^[A-Z]+$/).test(word.charAt(0));
}


function filterPunctuation(text){
  var punctuationless = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  return punctuationless.replace(/\s{2,}/g," "); // update this to save punctuation as prop for reinsertment later
}

var wordBlacklist = [ // converted to lower case before testing
  'i',
  'went',
  'is'
];

var posBlacklist = [
 'CC',    // conjunction
 'DT',    // determiner - article
 'EX',    // existential there
 'IN',    // preposition
 'NNP',   // proper noun
 'NNPS',  // proper nown plural
 'PP$',   // possessive pronoun
 'PRP',   // personal pronoun
 'RP',    // particle
 'SYM',   // symbol
 'UH',    // interjection
 'WP',    // Wh pronown
 'WP$',   // possessive-Wh
 'MD',    // modal
 'FW',    // foreign word
 'CD',    // cardinal number
 'TO',    // to
 'LS'     // list item marker
];

function simplifyPos(tag) {
  if ( tag === 'NN' ) {
    return 'noun';
  } else if ( tag === 'VB' || tag === 'VBD' || tag === 'VBG' || tag === 'VBN' || tag === 'VBP' || tag === 'VBZ') {
      return 'verb';
  } else if ( tag === 'JJ' || tag === 'JJR' || tag === 'JJS') {
      return 'adjective';
  } else if ( tag === 'RB' || tag === 'RBR' || tag === 'RBS') {
      return 'adverb';
  }
}


// note: Key of wordsWhiteList is index of word in original text
function createWhiteList(words){
  $.each(words, function(i,val){
    var blackListTest = cleanBlacklist(words[i]);
    if (blackListTest) { wordsWhiteList[i] = { word: words[i], pos: simplifyPos(posTester(words[i]))}; }
  });
}



function createSynonymObject(wordsWhiteList) {
    for(var prop in wordsWhiteList) {
      if(wordsWhiteList.hasOwnProperty(prop)) {
        // [prop] is the index holding an object with props word and pos
        getSynonym(wordsWhiteList[prop],wordsWhiteList);
      }
    }
}

// function replaceText(words , synObj) {
//   $.each(words, function(i,val) {
//     if( synObj[i] ) {
//       words[i] = synObj[i];
//     }
//   });
// }

function randomSynonym(json, wordItem, pos) {
  if (pos in json) { // if there's a pos match in thesaurus object
    var numSyn = json[pos]['syn'].length; // **** !! pass in pos & match to lookup @12 !! ****
    var index = Math.ceil((Math.random()*numSyn-1)).toFixed();
    return json[pos]['syn'][index];
  }
}

function assignSyn(wordsWhiteList, json, pos){
  wordsWhiteList['syn'] = json[pos]['syn'];
}

function logSynonym(word, randomSyn) {
  $('.result').append(word + ' = ' + randomSyn + '<br>');
}

function getSynonym(word , wordsWhiteList) {
  var wordItem = word.word;
  var pos = word.pos;
  $.ajax({
       url:'http://words.bighugelabs.com/api/2/'+ apiKey + '/' + wordItem + '/json?callback=?',
       dataType: 'json',
       complete: function(jqXHR , textStatus) {
         if (textStatus === 'parseerror') {
            console.log(wordItem + " doesn't have any synonyms");
         }
       },
       success:function(json){
         var randomSyn =  randomSynonym(json,wordItem,pos);
         if(randomSyn) {
          logSynonym(wordItem, randomSyn);
          assignSyn(wordsWhiteList, json, pos);
         }

       },
       error:function(){
        console.log('error');
       }
  });
}


  var words = [];
  wordsWhiteList = {}; // 'original position' : 'word'

  // create array of words in #text
  words = filterPunctuation($('#text').text()).split(" ");

  // take words, filter against posBlacklist & wordBlacklist
  // then build wordsWhiteList{} by running posTester() with keys [word] & [pos]
  createWhiteList(words);

  // take wordsWhiteList{} and for each prop (which is an object with keys [word & [pos]]) ...
  // run getSynonym(), which creates wrodsSynObj ...
  // with keys of words holding an array of synonums
  createSynonymObject(wordsWhiteList);



