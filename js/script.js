var wordBlacklist = [ // converted to lower case before testing
  'i',
  'my',
  'you',
  'went',
  'is',
  'was',
  'has',
  'had',
  'been',
  'are',
  'were',
  'of',
  'saw',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'hundred',
  'thousand',
  'be',
  'more',
  'adam',
  'his',
  'hers'
];

// part-of-speech tags to reject for thesaurus lookup
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

/* ===========================================================================================
  Test word array against blacklist, run part-of-speech tester, create whitelist obj
   =========================================================================================== */

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

// GERUND -> INFINITIVE: for verbs ending in a short vowel followed by a consonant:
// test = are the letters preceding 'ing' both consonants and are they equal
// chop off last four letters.  e.g. - chopping --> chop


function isUpperCase( word ) {
  return (/^[A-Z]+$/).test(word.charAt(0));
}

// convert pos-tagger flags to simpler part-of-speech tags for big huge thesaurus api
function simplifyPos(tag) {
  if ( tag === 'NN' || tag === 'NNS') {
    return 'noun';
  } else if ( tag === 'VB' || tag === 'VBD' || tag === 'VBG' || tag === 'VBN' || tag === 'VBP' || tag === 'VBZ') {
      return 'verb';
  } else if ( tag === 'JJ' || tag === 'JJR' || tag === 'JJS') {
      return 'adjective';
  } else if ( tag === 'RB' || tag === 'RBR' || tag === 'RBS') {
      return 'adverb';
  }
}
// future version must identify gerunds, remove 'ing' then replace  after synonym found
// also, gerunds should reject synonyms of > 1 word,
// otherwise gerund conversion will create staying > stick arounding


// note: Key of wordsWhiteList is index of word in original text
function createWhiteList(words) {
  $.each(words, function(i,val) {
    var blackListTest = cleanBlacklist(words[i]);
    if (blackListTest) {
      wordsWhiteList[i] = {
        word: {
          orig: words[i],
          syn: {} },
          pos: simplifyPos(posTester(words[i]))
      };
      console.log('LIST: ' + words[i] + ' is ' + posTester(words[i]) );
    }
  });
}

/* =============================================================================
  Add synonym object to {wordList}
   ========================================================================== */

var apiKey = '086eaa6fe5c287a37b6e25a09586e7a9';
// http://words.bighugelabs.com/api/2/086eaa6fe5c287a37b6e25a09586e7a9/ /json

$.getSynonym = function(word) {
  return  $.ajax({
       url:'http://words.bighugelabs.com/api/2/'+ apiKey + '/' + word + '/json?callback=?',
       dataType: 'json'
   }).promise();
};

function assignSyn(word, pos){
  wordOrig = word['orig'];
  console.log('ASSIGN ' + wordOrig + ' is ' + pos);
  $.getSynonym(wordOrig).then(function(results) {
     word['syn'] = results[pos]['syn'];
  });
}

function createSynonymObject(wordList) {
  for (var prop in wordList) {
    if (wordList.hasOwnProperty(prop)) {
      var word = wordList[prop]['word'];
      var pos = wordList[prop]['pos'];
      assignSyn(word, pos);
    }
  }
}

/* =============================================================================
  Render thesaur-ized text
   ========================================================================== */

function replaceText() {
  $.each(words, function(i,val) {
      if (wordsWhiteList[i]) {
        if(wordsWhiteList[i]['word']['syn'].length > 0) {
          var numSyn = wordsWhiteList[i]['word']['syn'].length;
          var index = Math.ceil((Math.random()*numSyn-1)).toFixed();
          console.log(index);
          words[i] = '<span class="synonym">' + wordsWhiteList[i]['word']['syn'][index] + '</span>';
        }
      }
    });
  setTimeout(function() {
    $('#result').html(words.join(' '));
  }, 100);
}

/* =============================================================================
  Setup + init
   ========================================================================== */

var words = [];
var original;
wordsWhiteList = {}; // 'original position' : {word -> word, pos}

$('#form').submit(function(e){
  e.preventDefault();
 
  // create array of words in #text
  original = $('#area').val();
  words = S(original).collapseWhitespace().stripPunctuation().split(" ");
  console.log(words);

  wordsWhiteList = {};
  // take words, filter against posBlacklist & wordBlacklist
  // then build wordsWhiteList{} by running posTester() with key index and values [word] & [pos]
  createWhiteList(words);

  // take wordsWhiteList{} and for each prop (which is an object with keys [word & [pos]]) ...
  // run getSynonym(), which creates wrodsSynObj ...
  // with keys of words holding an array of synonums
  createSynonymObject(wordsWhiteList);
});

// next steps:
//   * find punctuation and save to word object.
//   * re-insert puncatation during replacetext()


