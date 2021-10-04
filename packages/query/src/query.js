// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  not: 'not',
  and: 'and',
  or: 'or',
  in: 'in',
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  colon: ':',
  comma: ',',
  sortBy: 'sort by',
  le: '<=',
  ge: '>=',
  ne: '!=',
  gt: '>',
  lt: '<',
  eq: '=',
  text: [
    {match: /"(?:\\["\\rn]|[^"\\])*?"/, lineBreaks: true, value: x => x.slice(1, -1)},
    {match: /'(?:\\['\\rn]|[^'\\])*?'/, lineBreaks: true, value: x => x.slice(1, -1)},
  ],
  value: {match: /[^ \t\n'"(),:\[\]]+/, value: x => x},
});

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Main", "symbols": ["_", "Query", "_"], "postprocess": data => data[1]},
    {"name": "Query", "symbols": ["Terms", "__", "SortBy"], "postprocess": data => { return {type: 'query', value: data[0], sortBy: data[2].value, col: data[0].col} }},
    {"name": "Query", "symbols": ["Terms"], "postprocess": data => { return {type: 'query', value: data[0], sortBy: false} }},
    {"name": "SortBy", "symbols": [(lexer.has("sortBy") ? {type: "sortBy"} : sortBy), "__", (lexer.has("value") ? {type: "value"} : value)], "postprocess": data => { return {type: 'sortKey', value: data[2].value, col: data[0].col } }},
    {"name": "Terms", "symbols": ["OrExpression", "__", "Terms"], "postprocess": data => { return {type: 'terms', value: data[2].type == 'terms' ? [data[0], ...data[2].value] : [data[0], data[2]], col: data[0].col } }},
    {"name": "Terms", "symbols": ["OrExpression"], "postprocess": data => data[0]},
    {"name": "OrExpression", "symbols": ["OrExpression", "__", (lexer.has("or") ? {type: "or"} : or), "__", "AndExpression"], "postprocess": data => { return {type: 'or', left: data[0], right: data[4], col: data[0].col} }},
    {"name": "OrExpression", "symbols": ["AndExpression"], "postprocess": data => data[0]},
    {"name": "AndExpression", "symbols": ["AndExpression", "__", (lexer.has("and") ? {type: "and"} : and), "__", "NotExpression"], "postprocess": data => { return {type: 'and', left: data[0], right: data[4], col: data[0].col} }},
    {"name": "AndExpression", "symbols": ["NotExpression"], "postprocess": data => data[0]},
    {"name": "NotExpression", "symbols": [(lexer.has("not") ? {type: "not"} : not), "__", "NotExpression"], "postprocess": data => { return {type: 'not', value: data[2], col: data[0].col} }},
    {"name": "NotExpression", "symbols": ["Expression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["KeyValue"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["Value"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "Terms", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => { return {type: 'paren', value: data[1], col: data[0].col } }},
    {"name": "KeyValue", "symbols": [(lexer.has("value") ? {type: "value"} : value), "__", {"literal":"in"}, "__", "ListExpression"], "postprocess": data => { return {type: 'in', key: data[0].value, value: data[4], col: data[0].col} }},
    {"name": "KeyValue", "symbols": [(lexer.has("value") ? {type: "value"} : value), "_", "Comp", "_", "Value"], "postprocess": data => { return {type: 'cmp', key: data[0].value, op: data[2][0].value, value: data[4], col: data[0].col} }},
    {"name": "KeyValue", "symbols": [(lexer.has("value") ? {type: "value"} : value), (lexer.has("colon") ? {type: "colon"} : colon), "Value"], "postprocess": data => { return {type: 'cmp', key: data[0].value, op: '=', value: data[2], col: data[0].col} }},
    {"name": "Value", "symbols": [(lexer.has("value") ? {type: "value"} : value)], "postprocess": data => { return {type: 'value', value: data[0].value, col: data[0].col} }},
    {"name": "Value", "symbols": [(lexer.has("text") ? {type: "text"} : text)], "postprocess": data => { return {type: 'text', value: data[0].value, col: data[0].col} }},
    {"name": "Comp", "symbols": [(lexer.has("le") ? {type: "le"} : le)]},
    {"name": "Comp", "symbols": [(lexer.has("ge") ? {type: "ge"} : ge)]},
    {"name": "Comp", "symbols": [(lexer.has("ne") ? {type: "ne"} : ne)]},
    {"name": "Comp", "symbols": [(lexer.has("eq") ? {type: "eq"} : eq)]},
    {"name": "Comp", "symbols": [(lexer.has("lt") ? {type: "lt"} : lt)]},
    {"name": "Comp", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "ListExpression", "symbols": ["Range"], "postprocess": data => { return {type: 'range', from: data[0][0], to: data[0][1]} }},
    {"name": "ListExpression", "symbols": ["List"], "postprocess": data => { return {type: 'list', value: data[0]} }},
    {"name": "Range", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "_", "Value", "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "Value", "_", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": data => [data[2], data[6]]},
    {"name": "List", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "ListValues", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => data[2]},
    {"name": "ListValues", "symbols": ["Value"], "postprocess": data => [data[0]]},
    {"name": "ListValues", "symbols": ["Value", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "ListValues"], "postprocess": data => [data[0]].concat(data[4])},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
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
