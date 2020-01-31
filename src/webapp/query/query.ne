@{%
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
  number: {match: /(?:[-])?0|[1-9][0-9]*(?:\.[0-9]+)?/, value: x => +x},
  value: /[-_.A-Za-z0-9]+/,
});

%}

@lexer lexer

Main -> 
  _ Query _ {% data => data[1] %}

Query ->
  Terms __ SortBy {% data => { return {type: 'query', value: data[0], sortBy: data[2].value, col: data[2].col } } %}
  | Terms {% data => { return {type: 'query', value: data[0], sortBy: false} } %}

SortBy ->
  %sortBy __ %value {% data => data[2] %}

Terms ->
  OrExpression __ Terms {% data => { return {type: 'terms', value: [data[0]].concat(data[2].value)} } %}
  | OrExpression {% data => {% data => { return {type: 'terms', value: [data[0]]} } %} %}

OrExpression -> 
  AndExpression __ %or __ OrExpression {% data => { return {type: 'or', left: data[0], right: data[4]} } %}
  | AndExpression {% data => data[0] %}

AndExpression ->
  NotExpression __ %and __ AndExpression {% data => { return {type: 'and', left: data[0], right: data[4]} } %}
  | NotExpression {% data => data[0] %}

NotExpression -> 
  %not __ NotExpression {% data => { return {type: 'not', value: data[2]} } %}
  | Expression {% data => data[0] %}

Expression ->
  KeyValue {% data => data[0] %}
  | Value {% data => data[0] %}
  | %lparen Terms %rparen {% data => data[1] %}

KeyValue ->
  %value __ "in" _ ListExpression {% data => { return {type: 'in', key: data[0].value, col: data[0].col, value: data[4]} } %}
  | %value _ Comp _ Value {% data => { return {type: 'cmp', key: data[0].value, op: data[2][0].value, value: data[4], col: data[0].col} } %}

Value -> 
  %number {% data => { return {type: 'number', value: data[0].value, col: data[0].col} } %}
  | %value {% data => { return {type: 'value', value: data[0].value, col: data[0].col} } %}
  | %text {% data => { return {type: 'text', value: data[0].value, col: data[0].col} } %}

Comp -> %le | %ge | %ne | %eq | %lt | %gt | %colon

ListExpression -> 
  Range {% data => { return {type: 'range', value: data[0]} }  %}
  | List {% data => { return {type: 'list', value: data[0]} } %}

Range ->
  %lbracket _ Value _ %colon _ Value _ %rbracket {% data => [data[2], data[6]] %}

List -> 
  %lparen _ ListValues _ %rparen {% data => data[2] %}

ListValues ->
  Value {% data => data[0] %}
  | Value _ %comma _ ListValues {% data => [data[0]].concat(data[4]) %}

_ -> %ws:*
__ -> %ws
