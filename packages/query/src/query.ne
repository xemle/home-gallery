@{%
const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  not: /not\s/,
  and: /and\s/,
  or: /or\s/,
  inOp: /in\s/, // 'in' as key breaks
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  colon: ':',
  comma: ',',
  sortBy: /sort by\s/,
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

%}

@lexer lexer

Main ->
  _ Query _ {% data => data[1] %}

Query ->
  Terms __ SortBy {% data => { return {type: 'query', value: data[0], sortBy: data[2].value, col: data[0].col} } %}
  | Terms {% data => { return {type: 'query', value: data[0], sortBy: false} } %}

SortBy ->
  %sortBy _ %value {% data => { return {type: 'sortKey', value: data[2].value, col: data[0].col } } %}

Terms ->
  OrExpression __ Terms {% data => { return {type: 'terms', value: data[2].type == 'terms' ? [data[0], ...data[2].value] : [data[0], data[2]], col: data[0].col } } %}
  | OrExpression {% data => data[0] %}

OrExpression ->
  OrExpression __ %or _ AndExpression {% data => { return {type: 'or', left: data[0], right: data[4], col: data[0].col} } %}
  | AndExpression {% data => data[0] %}

AndExpression ->
  AndExpression __ %and _ NotExpression {% data => { return {type: 'and', left: data[0], right: data[4], col: data[0].col} } %}
  | NotExpression {% data => data[0] %}

NotExpression ->
  %not _ NotExpression {% data => { return {type: 'not', value: data[2], col: data[0].col} } %}
  | Expression {% data => data[0] %}

Expression ->
  KeyValue {% data => data[0] %}
  | Value {% data => data[0] %}
  | %lparen Terms %rparen {% data => { return {type: 'paren', value: data[1], col: data[0].col } } %}

KeyValue ->
  ListExpression {% data => data[0] %}
  | %value _ Comp _ Value {% data => { return {type: 'cmp', key: data[0].value, op: data[2][0].value, value: data[4], col: data[0].col} } %}
  | %value %colon Value {% data => { return {type: 'cmp', key: data[0].value, op: '=', value: data[2], col: data[0].col} } %}

Value ->
  %value {% data => { return {type: 'value', value: data[0].value, col: data[0].col} } %}
  | %text {% data => { return {type: 'text', value: data[0].value, col: data[0].col} } %}

Comp -> %le | %ge | %ne | %eq | %lt | %gt

ListExpression ->
  %value __ %inOp _ ListValues {% data => { return {type: 'in', key: data[0].value, value: data[4], col: data[0].col} } %}

ListValues ->
  Range {% data => { return {type: 'range', from: data[0][0], to: data[0][1]} }  %}
  | List {% data => { return {type: 'list', value: data[0]} } %}

Range ->
  %lbracket _ Value _ %colon _ Value _ %rbracket {% data => [data[2], data[6]] %}

List ->
  %lparen _ ListValues _ %rparen {% data => data[2] %}

ListValues ->
  Value {% data => [data[0]] %}
  | Value _ %comma _ ListValues {% data => [data[0]].concat(data[4]) %}

_ -> %ws:* {% () => null %}
__ -> %ws
