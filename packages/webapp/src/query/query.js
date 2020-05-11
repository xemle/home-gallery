// Generated automatically by nearley, version 2.19.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  not: 'not',
  and: 'and',
  or: 'or',
  lparen: '(',
  rparen: ')',
  colon: ':',
  text: [
    {match: /"(?:\\["\\rn]|[^"\\])*?"/, lineBreaks: true, value: x => x.slice(1, -1)},
    {match: /'(?:\\['\\rn]|[^'\\])*?'/, lineBreaks: true, value: x => x.slice(1, -1)},
  ],
  value: /[-_.A-Za-z0-9]+/,
});

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Main", "symbols": ["_", "Query", "_"], "postprocess": data => data[1]},
    {"name": "Query", "symbols": ["Terms"], "postprocess": data => { return {type: 'query', value: data[0], sortBy: false} }},
    {"name": "Terms", "symbols": ["OrExpression", "__", "Terms"], "postprocess": data => { return {type: 'terms', value: [data[0]].concat(data[2].value)} }},
    {"name": "Terms", "symbols": ["OrExpression"], "postprocess": data => { return {type: 'terms', value: [data[0]]} }},
    {"name": "OrExpression", "symbols": ["AndExpression", "__", (lexer.has("or") ? {type: "or"} : or), "__", "OrExpression"], "postprocess": data => { return {type: 'or', left: data[0], right: data[4]} }},
    {"name": "OrExpression", "symbols": ["AndExpression"], "postprocess": data => data[0]},
    {"name": "AndExpression", "symbols": ["NotExpression", "__", (lexer.has("and") ? {type: "and"} : and), "__", "AndExpression"], "postprocess": data => { return {type: 'and', left: data[0], right: data[4]} }},
    {"name": "AndExpression", "symbols": ["NotExpression"], "postprocess": data => data[0]},
    {"name": "NotExpression", "symbols": [(lexer.has("not") ? {type: "not"} : not), "__", "NotExpression"], "postprocess": data => { return {type: 'not', value: data[2]} }},
    {"name": "NotExpression", "symbols": ["Expression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["Value"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "Terms", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => data[1]},
    {"name": "Value", "symbols": [(lexer.has("value") ? {type: "value"} : value)], "postprocess": data => { return {type: 'value', value: data[0].value, col: data[0].col} }},
    {"name": "Value", "symbols": [(lexer.has("text") ? {type: "text"} : text)], "postprocess": data => { return {type: 'value', value: data[0].value, col: data[0].col} }},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]}
]
  , ParserStart: "Main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
