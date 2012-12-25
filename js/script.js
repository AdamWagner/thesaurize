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
  'adam'
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

function isUpperCase( word ) {
  return (/^[A-Z]+$/).test(word.charAt(0));
}


// convert pos-tagger flags to simpler part-of-speech tags for big huge thesaurus api
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
// future version must identify gerunds, remove 'ing' then replace  after synonym found
// also, gerunds should reject synonyms of > 1 word, 
// otherwise gerund conversion will create staying > stick arounding


// note: Key of wordsWhiteList is index of word in original text
function createWhiteList(words){
  $.each(words, function(i,val){
    var blackListTest = cleanBlacklist(words[i]);
    if (blackListTest) { wordsWhiteList[i] = { word: words[i], pos: simplifyPos(posTester(words[i]))}; }
  });
}

/* =============================================================================
  Add synonym object to {wordList} 
   ========================================================================== */

function createSynonymObject(wordsWhiteList) {
    for(var prop in wordsWhiteList) {
      if(wordsWhiteList.hasOwnProperty(prop)) {
        // [prop] is the index holding an object with word and pos
        getSynonym(wordsWhiteList[prop],wordsWhiteList);
      }
    }
}

function assignSyn(wordItem, json, pos){
  wordItem['syn'] = json[pos]['syn'];
}

var apiKey = '086eaa6fe5c287a37b6e25a09586e7a9';
// http://words.bighugelabs.com/api/2/086eaa6fe5c287a37b6e25a09586e7a9/ /json

function getSynonym(word , wordsWhiteList) {
  var wordItem = word.word;
  var pos = word.pos;
  $.ajax({
       url:'http://words.bighugelabs.com/api/2/'+ apiKey + '/' + wordItem + '/json?callback=?',
       dataType: 'json',
       complete : function(jqXHR , textStatus) {
         if (textStatus === 'parseerror') {
            console.log(wordItem + " doesn't have any synonyms");
         }
       },
       success : function(json){
        if (json[pos]) {
          assignSyn(word, json, pos);
          replaceText();
        } else {
          console.log('wrong part of speech');
        }
       },
       error : function(){
        console.log('error');
       }
  });
}

/* =============================================================================
  Render thesaur-ized text 
   ========================================================================== */

function replaceText() {
    $.each(words, function(i,val) {
        if (wordsWhiteList[i]) {
          if(wordsWhiteList[i]['syn']) {
            var numSyn = wordsWhiteList[i]['syn'].length; 
            var index = Math.ceil((Math.random()*numSyn-1)).toFixed();
            words[i] = '<span style="color:#993f11">' + wordsWhiteList[i]['syn'][index] + '</span>';
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


