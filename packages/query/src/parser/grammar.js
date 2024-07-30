// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
function id(x) { return x[0]; }

import moo from 'moo'

const keywords = ['or', 'and', 'not', 'all', 'in', 'order', 'by', 'asc', 'desc', 'count', 'exists']

const addUpperCase = (r, v) => r.concat(v, v.toUpperCase())

// Token 'in' needs to be escaped. Otherwise it becomes the JS keyword in and breaks the JS syntax
const toTokenMap = k => [k === 'in' ? 'inOp' : k, k]

const token2Keyword = Object.fromEntries(keywords.reduce(addUpperCase, []).map(toTokenMap))

const lexer = moo.compile({
  ws: /[ \t]+/,
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  colon: ':',
  comma: ',',
  le: '<=',
  ge: '>=',
  ne: '!=',
  gt: '>',
  lt: '<',
  eq: '=',
  tilde: '~',
  compoundChar: /[/]/,
  text: [
    {match: /"(?:\\["\\rn]|[^"\\])*?"/, lineBreaks: true, value: x => x.slice(1, -1)},
    {match: /'(?:\\['\\rn]|[^'\\])*?'/, lineBreaks: true, value: x => x.slice(1, -1)},
  ],
  identifier: {match: /[\u00c0-\u017fA-Za-z.]+/, value: x => x, type: moo.keywords(token2Keyword)},
  value: {match: /[^ \t\n\r:=<>!()[\],]+/, value: x => x},
})

let Lexer = lexer;
let ParserRules = [
    {"name": "Main", "symbols": ["_", "Query", "_"], "postprocess": data => data[1]},
    {"name": "Query", "symbols": ["Terms", "__", "OrderExpression"], "postprocess": data => ({type: 'query', value: data[0], orderBy: data[2], col: data[0].col})},
    {"name": "Query", "symbols": ["OrderExpression"], "postprocess": data => ({type: 'query', orderBy: data[0], col: data[0].col })},
    {"name": "Query", "symbols": ["Terms"], "postprocess": data => ({type: 'query', value: data[0], col: data[0].col })},
    {"name": "OrderExpression", "symbols": ["OrderBy", "__", "Order"], "postprocess": data => ({type: 'orderBy', value: data[2], direction: false, col: data[0].col})},
    {"name": "OrderExpression", "symbols": ["OrderBy", "__", "Order", "__", "OrderDirection"], "postprocess": data => ({type: 'orderBy', value: data[2], direction: data[4].value, col: data[0].col})},
    {"name": "OrderBy", "symbols": [(lexer.has("order") ? {type: "order"} : order), "_", (lexer.has("by") ? {type: "by"} : by)], "postprocess": data => ({col: data[0].col})},
    {"name": "OrderBy", "symbols": [(lexer.has("ORDER") ? {type: "ORDER"} : ORDER), "_", (lexer.has("BY") ? {type: "BY"} : BY)], "postprocess": data => ({col: data[0].col})},
    {"name": "Order", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": data => ({type: 'orderKey', value: data[0].value, col: data[0].col})},
    {"name": "Order$subexpression$1", "symbols": [(lexer.has("count") ? {type: "count"} : count)]},
    {"name": "Order$subexpression$1", "symbols": [(lexer.has("COUNT") ? {type: "COUNT"} : COUNT)]},
    {"name": "Order", "symbols": ["Order$subexpression$1", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => ({type: 'orderFn', fn: data[0][0].value, value: data[4].value, col: data[0][0].col})},
    {"name": "OrderDirection$subexpression$1", "symbols": [(lexer.has("asc") ? {type: "asc"} : asc)]},
    {"name": "OrderDirection$subexpression$1", "symbols": [(lexer.has("ASC") ? {type: "ASC"} : ASC)]},
    {"name": "OrderDirection$subexpression$1", "symbols": [(lexer.has("desc") ? {type: "desc"} : desc)]},
    {"name": "OrderDirection$subexpression$1", "symbols": [(lexer.has("DESC") ? {type: "DESC"} : DESC)]},
    {"name": "OrderDirection", "symbols": ["OrderDirection$subexpression$1"], "postprocess": data => ({type: 'orderDir', value: data[0][0].value.toLowerCase(), col: data[0][0].col})},
    {"name": "Terms", "symbols": ["OrExpression", "__", "Terms"], "postprocess": data => ({type: 'terms', value: data[2].type == 'terms' ? [data[0], ...data[2].value] : [data[0], data[2]], col: data[0].col })},
    {"name": "Terms", "symbols": ["OrExpression"], "postprocess": data => data[0]},
    {"name": "OrExpression$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or)]},
    {"name": "OrExpression$subexpression$1", "symbols": [(lexer.has("OR") ? {type: "OR"} : OR)]},
    {"name": "OrExpression", "symbols": ["OrExpression", "__", "OrExpression$subexpression$1", "__", "AndExpression"], "postprocess": data => ({type: 'or', value: [data[0], data[4]], col: data[0].col})},
    {"name": "OrExpression", "symbols": ["AndExpression"], "postprocess": data => data[0]},
    {"name": "AndExpression$subexpression$1", "symbols": [(lexer.has("and") ? {type: "and"} : and)]},
    {"name": "AndExpression$subexpression$1", "symbols": [(lexer.has("AND") ? {type: "AND"} : AND)]},
    {"name": "AndExpression", "symbols": ["AndExpression", "__", "AndExpression$subexpression$1", "__", "NotExpression"], "postprocess": data => ({type: 'and', value: [data[0], data[4]], col: data[0].col})},
    {"name": "AndExpression", "symbols": ["NotExpression"], "postprocess": data => data[0]},
    {"name": "NotExpression$subexpression$1", "symbols": [(lexer.has("not") ? {type: "not"} : not)]},
    {"name": "NotExpression$subexpression$1", "symbols": [(lexer.has("NOT") ? {type: "NOT"} : NOT)]},
    {"name": "NotExpression", "symbols": ["NotExpression$subexpression$1", "__", "NotExpression"], "postprocess": data => ({type: 'not', value: data[2], col: data[0][0].col})},
    {"name": "NotExpression$subexpression$2", "symbols": [(lexer.has("not") ? {type: "not"} : not)]},
    {"name": "NotExpression$subexpression$2", "symbols": [(lexer.has("NOT") ? {type: "NOT"} : NOT)]},
    {"name": "NotExpression", "symbols": ["NotExpression$subexpression$2", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Terms", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => ({type: 'not', value: data[4], col: data[0][0].col })},
    {"name": "NotExpression", "symbols": ["Expression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["KeyValue"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["CmpExpression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["ListExpression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": ["FunctionExpression"], "postprocess": data => data[0]},
    {"name": "Expression", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Terms", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => ({type: 'paren', value: data[2], col: data[0].col })},
    {"name": "Expression", "symbols": ["Value"], "postprocess": data => data[0]},
    {"name": "KeyValue", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("colon") ? {type: "colon"} : colon), "Value"], "postprocess": data => ({type: 'keyValue', key: data[0].value, value: data[2], col: data[0].col})},
    {"name": "CmpExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", "Comparator", "_", "Value"], "postprocess": data => ({type: 'cmp', key: data[0].value, op: data[2].value, value: data[4], col: data[0].col})},
    {"name": "FunctionExpression", "symbols": ["CmpFunction", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "_", "Comparator", "_", "Value"], "postprocess": data => ({type: 'cmpFn', fn: data[0].value, key: data[4].value, op: data[8].value, value: data[10], col: data[0].col})},
    {"name": "FunctionExpression", "symbols": ["ExistsFunction", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => ({type: 'existsFn', key: data[4].value, col: data[0].col})},
    {"name": "CmpFunction$subexpression$1", "symbols": [(lexer.has("count") ? {type: "count"} : count)]},
    {"name": "CmpFunction$subexpression$1", "symbols": [(lexer.has("COUNT") ? {type: "COUNT"} : COUNT)]},
    {"name": "CmpFunction", "symbols": ["CmpFunction$subexpression$1"], "postprocess": data => ({type: 'countFn', value: 'count', col: data[0][0].col})},
    {"name": "ExistsFunction$subexpression$1", "symbols": [(lexer.has("exists") ? {type: "exists"} : exists)]},
    {"name": "ExistsFunction$subexpression$1", "symbols": [(lexer.has("EXISTS") ? {type: "EXISTS"} : EXISTS)]},
    {"name": "ExistsFunction", "symbols": ["ExistsFunction$subexpression$1"], "postprocess": data => ({type: 'existsFn', value: 'has', col: data[0][0].col})},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("le") ? {type: "le"} : le)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("ge") ? {type: "ge"} : ge)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("ne") ? {type: "ne"} : ne)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("eq") ? {type: "eq"} : eq)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("lt") ? {type: "lt"} : lt)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "Comparator$subexpression$1", "symbols": [(lexer.has("tilde") ? {type: "tilde"} : tilde)]},
    {"name": "Comparator", "symbols": ["Comparator$subexpression$1"], "postprocess": data => ({ type: 'comp', value: data[0][0].value, col: data[0][0].col })},
    {"name": "ListExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "__", "AllIn", "__", "List"], "postprocess": data => ({type: 'allIn', key: data[0].value, value: data[4].value, col: data[0].col})},
    {"name": "ListExpression$subexpression$1", "symbols": [(lexer.has("inOp") ? {type: "inOp"} : inOp)]},
    {"name": "ListExpression$subexpression$1", "symbols": [(lexer.has("IN") ? {type: "IN"} : IN)]},
    {"name": "ListExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "__", "ListExpression$subexpression$1", "__", "List"], "postprocess": data => ({type: 'inList', key: data[0].value, value: data[4].value, col: data[0].col})},
    {"name": "ListExpression$subexpression$2", "symbols": [(lexer.has("inOp") ? {type: "inOp"} : inOp)]},
    {"name": "ListExpression$subexpression$2", "symbols": [(lexer.has("IN") ? {type: "IN"} : IN)]},
    {"name": "ListExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "__", "ListExpression$subexpression$2", "__", "Range"], "postprocess": data => ({type: 'inRange', key: data[0].value, value: data[4].value, col: data[0].col})},
    {"name": "AllIn", "symbols": [(lexer.has("all") ? {type: "all"} : all), "__", (lexer.has("inOp") ? {type: "inOp"} : inOp)]},
    {"name": "AllIn", "symbols": [(lexer.has("ALL") ? {type: "ALL"} : ALL), "__", (lexer.has("IN") ? {type: "IN"} : IN)]},
    {"name": "List", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "ListValues", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": data => ({ type: 'list', value: data[2], col: data[0].col})},
    {"name": "ListValues", "symbols": ["Value"], "postprocess": data => [data[0]]},
    {"name": "ListValues", "symbols": ["Value", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "ListValues"], "postprocess": data => [data[0]].concat(data[4])},
    {"name": "ListValues", "symbols": ["Value", "_", "ListValues"], "postprocess": data => [data[0]].concat(data[2])},
    {"name": "Range", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "_", "Value", "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "Value", "_", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": data => ({type: 'range', value: [data[2], data[6]], col: data[0].col})},
    {"name": "Value", "symbols": [(lexer.has("text") ? {type: "text"} : text)], "postprocess": data => ({type: 'text', value: data[0].value, col: data[0].col})},
    {"name": "Value", "symbols": ["CompoundValue"], "postprocess": data => data[0]},
    {"name": "CompoundValue", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": data => ({type: 'identifier', value: data[0].value, col: data[0].col})},
    {"name": "CompoundValue", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "ComboundChar", "CompoundValue"], "postprocess": data => ({type: 'comboundValue', value: `${data[0]}${data[1].value}${data[2].value}`, col: data[0].col})},
    {"name": "CompoundValue", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "CompoundValue"], "postprocess": data => ({type: 'comboundValue', value: `${data[0]}${data[1].value}`, col: data[0].col})},
    {"name": "CompoundValue", "symbols": [(lexer.has("value") ? {type: "value"} : value)], "postprocess": data => ({type: 'comboundValue', value: `${data[0]}`, col: data[0].col})},
    {"name": "ComboundChar$subexpression$1", "symbols": [(lexer.has("compoundChar") ? {type: "compoundChar"} : compoundChar)]},
    {"name": "ComboundChar", "symbols": ["ComboundChar$subexpression$1"], "postprocess": data => ({type: 'compoundChar', value: data[0][0].value, col: data[0][0].col})},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
    {"name": "__", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]}
];
let ParserStart = "Main";
export default { Lexer, ParserRules, ParserStart };
