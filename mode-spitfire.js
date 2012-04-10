define('ace/mode/spitfire', function(require, exports, module) {

  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var Tokenizer = require("ace/tokenizer").Tokenizer;
  var SpitfireHighlightRules = require("ace/mode/spitfire_highlight_rules").SpitfireHighlightRules;

  var Mode = function() {
    this.$tokenizer = new Tokenizer(new SpitfireHighlightRules().getRules());
  };
  oop.inherits(Mode, TextMode);

  (function() {
    // Extra logic goes here. (see below)
  }).call(Mode.prototype);

  exports.Mode = Mode;
});

define('ace/mode/spitfire_highlight_rules', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var SpitfireHighlightRules = function() {
  this.$rules = {
    start: [ {
      token: 'comment',
      regex: '^\\W*##.*$'
    }, {
      token: 'constant.language',
      regex: '^\\W*#.+$'
    }, {
      token: 'variable',
      regex: '\\$[^< )"]+'
    } ]
  };
};

/*
common tokens

invisible
keyword
keyword.operator
constant
constant.language
constant.library
constant.numeric
invalid
invalid.illegal
invalid.deprecated
support
support.function
support.buildin
string
string.regexp
comment
comment.doc
comment.doc.tag
variable
variable.language
xml_pe
*/

oop.inherits(SpitfireHighlightRules, TextHighlightRules);
exports.SpitfireHighlightRules = SpitfireHighlightRules;
});

//highlighter rules

/*
The highlighter starts off in the "start" state. Tokens are strings, and tag the text with classes of the form ace_token. Multiple tokens can be applied to the same text by adding dots in the token, eg support.function will add the classes ace_support ace_function.

A regex can either be a flat regex (abc) or have matching groups ((a+)(b+)). There is a strict requirement that if matching groups are used, then they must cover the entire matched string ((hel)lo is invalid.)

For flat regex matches, token should be a String, or a Function that takes a single argument (the match) and returns a string token.

For grouped regex, token can be a String, in which case all matched groups are given that same token. It can be an Array (of the same length as the number of groups), whereby matches are given the token of the same alignment as in the match. For a function, the Function should take the same number of arguments as there are groups, and return an array of tokens as per before.
*/
/*
this.$rules = {
    stateName: [ {
        token: <token>, // String, Array, or Function
        regex: <regex>, // String
        next:  <next>   // Optional, String
    } ]
};
*/
/*
// Example rules:

{
  token : "constant",
  regex : "INT_MAX|INT_MIN"
} // INT_MAX -> constant(INT_MAX)

{
  token : ["constant", "keyword"],
  regex : "^(#{1,6})(.+)$"
} // ### Header -> constant(###), keyword( Header)

{
  token : "constant",
  regex : "(a+)(b)(\\1)"
} // aabaa -> constant(aabaa) :: abaa -> constant(aba) + a

{
  token : function (first, second) {
    if (first == "a") return ["constant", "keyword"];
    return ["keyword", "constant"];
  },
  regex: "(.)(world)"
} // aworld -> constant(a), keyword(world) :: bworld -> keyword(a), constant(world)
*/

//embed
/*
var CssHighlightRules = require("ace/mode/css_highlight_rules").CssHighlightRules;

this.$rules = {
    start: [ {
        token: "keyword",
        regex: "^style\\s*$",
        next: "css-start"
    } ]
};

this.embedRules(CssHighlightRules, "css-", [{
   token : "keyword",
   regex: "^endstyle\\s*$",
   next  : "start"
}]);


var CssMode = require("ace/mode/css").Mode;

var Mode = function() {
    var highlighter = new ExampleHighlightRules();

    this.$tokenizer = new Tokenizer(highlighter.getRules());
    this.$embeds = highlighter.getEmbeds();
    this.createModeDelegates({
      "css-": CssMode
    });
};
*/

