@{%
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

%}

@lexer lexer

Main -> 
  _ Query _ {% data => data[1] %}

Query ->
  Terms {% data => { return {type: 'query', value: data[0], sortBy: false} } %}

Terms ->
  OrExpression __ Terms {% data => { return {type: 'terms', value: [data[0]].concat(data[2].value)} } %}
  | OrExpression {% data => { return {type: 'terms', value: [data[0]]} } %}

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
  Value {% data => data[0] %}
  | %lparen Terms %rparen {% data => data[1] %}

Value -> 
  %value {% data => { return {type: 'value', value: data[0].value, col: data[0].col} } %}
  | %text {% data => { return {type: 'value', value: data[0].value, col: data[0].col} } %}

_ -> %ws:*
__ -> %ws
