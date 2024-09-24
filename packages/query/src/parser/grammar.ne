@preprocessor esmodule

@{%
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
  slash: '/',
  text: [
    {match: /"(?:\\["\\rn]|[^"\\])*?"/, lineBreaks: true, value: x => x.slice(1, -1)},
    {match: /'(?:\\['\\rn]|[^'\\])*?'/, lineBreaks: true, value: x => x.slice(1, -1)},
  ],
  identifier: {match: /[\u00c0-\u017fA-Za-z.]+/, value: x => x, type: moo.keywords(token2Keyword)},
  value: {match: /[^ \t\n\r:=<>!()[\],]+/, value: x => x},
})

%}

@lexer lexer

Main ->
  _ Query _ {% data => data[1] %}

Query ->
  Terms __ OrderExpression {% data => ({type: 'query', value: data[0], orderBy: data[2], col: data[0].col}) %}
  | OrderExpression {% data => ({type: 'query', orderBy: data[0], col: data[0].col }) %}
  | Terms {% data => ({type: 'query', value: data[0], col: data[0].col }) %}

OrderExpression ->
  OrderBy __ Order {% data => ({type: 'orderBy', value: data[2], direction: false, col: data[0].col}) %}
  | OrderBy __ Order __ OrderDirection {% data => ({type: 'orderBy', value: data[2], direction: data[4].value, col: data[0].col}) %}

OrderBy ->
  %order _ %by {% data => ({col: data[0].col}) %}
  | %ORDER _ %BY {% data => ({col: data[0].col}) %}

Order ->
  %identifier {% data => ({type: 'orderKey', value: data[0].value, col: data[0].col}) %}
  | (%count | %COUNT) _ %lparen _ %identifier _ %rparen {% data => ({type: 'orderFn', fn: data[0][0].value, value: data[4].value, col: data[0][0].col}) %}

OrderDirection ->
  (%asc | %ASC | %desc | %DESC ) {% data => ({type: 'orderDir', value: data[0][0].value.toLowerCase(), col: data[0][0].col}) %}

Terms ->
  OrExpression __ Terms {% data => ({type: 'terms', value: data[2].type == 'terms' ? [data[0], ...data[2].value] : [data[0], data[2]], col: data[0].col }) %}
  | OrExpression {% data => data[0] %}

OrExpression ->
  OrExpression __ (%or | %OR) __ AndExpression {% data => ({type: 'or', value: [data[0], data[4]], col: data[0].col}) %}
  | AndExpression {% data => data[0] %}

AndExpression ->
  AndExpression __ (%and | %AND) __ NotExpression {% data => ({type: 'and', value: [data[0], data[4]], col: data[0].col}) %}
  | NotExpression {% data => data[0] %}

NotExpression ->
  (%not | %NOT) __ NotExpression {% data => ({type: 'not', value: data[2], col: data[0][0].col}) %}
  | (%not | %NOT) _ %lparen _ Terms _ %rparen {% data => ({type: 'not', value: data[4], col: data[0][0].col }) %}
  | Expression {% data => data[0] %}

Expression ->
  KeyValue {% data => data[0] %}
  | CmpExpression {% data => data[0] %}
  | ListExpression {% data => data[0] %}
  | FunctionExpression {% data => data[0] %}
  | %lparen _ Terms _ %rparen {% data => ({type: 'paren', value: data[2], col: data[0].col }) %}
  | RangeValue {% data => data[0] %} # RangeValue has no colon which is used by KeyValue rule

KeyValue ->
  %identifier %colon Value {% data => ({type: 'keyValue', key: data[0].value, value: data[2], col: data[0].col}) %}

CmpExpression ->
  %identifier _ Comparator _ Value {% data => ({type: 'cmp', key: data[0].value, op: data[2].value, value: data[4], col: data[0].col}) %}

FunctionExpression ->
  CmpFunction _ %lparen _ %identifier _ %rparen _ Comparator _ Value {% data => ({type: 'cmpFn', fn: data[0].value, key: data[4].value, op: data[8].value, value: data[10], col: data[0].col}) %}
  | ExistsFunction _ %lparen _ %identifier _ %rparen {% data => ({type: 'existsFn', key: data[4].value, col: data[0].col}) %}

CmpFunction ->
  (%count | %COUNT) {% data => ({type: 'countFn', value: 'count', col: data[0][0].col}) %}

ExistsFunction ->
  (%exists | %EXISTS) {% data => ({type: 'existsFn', value: 'has', col: data[0][0].col}) %}

Comparator ->
  (%le | %ge | %ne | %eq | %lt | %gt | %tilde) {% data => ({ type: 'comp', value: data[0][0].value, col: data[0][0].col }) %}

ListExpression ->
  %identifier __ AllIn __ List {% data => ({type: 'allIn', key: data[0].value, value: data[4].value, col: data[0].col}) %}
  | %identifier __ (%inOp | %IN) __ List {% data => ({type: 'inList', key: data[0].value, value: data[4].value, col: data[0].col}) %}
  | %identifier __ (%inOp | %IN) __ Range {% data => ({type: 'inRange', key: data[0].value, value: data[4].value, col: data[0].col}) %}

AllIn ->
  %all __ %inOp
  | %ALL __ %IN

List ->
  %lparen _ ListValues _ %rparen {% data => ({ type: 'list', value: data[2], col: data[0].col}) %}

ListValues ->
  Value {% data => [data[0]] %}
  | Value _ %comma _ ListValues {% data => [data[0]].concat(data[4]) %}
  | Value _ ListValues {% data => [data[0]].concat(data[2]) %}

Range ->
  %lbracket _ RangeValue _ %colon _ RangeValue _ %rbracket {% data => ({type: 'range', value: [data[2], data[6]], col: data[0].col}) %}

# RangeValue has no colon for range syntax: foo in [from:to]
RangeValue ->
  %text {% data => ({type: 'text', value: data[0].value, col: data[0].col}) %}
  | SimpleValue {% data => data[0] %}

Value ->
  %text {% data => ({type: 'text', value: data[0].value, col: data[0].col}) %}
  | ColonValue {% data => data[0] %}

ColonValue ->
  %identifier %colon ColonValue {% data => ({type: 'value', value: `${data[0]}${data[1].value}${data[2].value}`, col: data[0].col}) %}
  | %slash ColonValue {% data => ({type: 'value', value: `${data[0].value}${data[1].value}`, col: data[0].col}) %}
  | SimpleValue {% data => data[0] %}

SimpleValue ->
  %slash SimpleValue {% data => ({type: 'value', value: `${data[0].value}${data[1].value}`, col: data[0].col}) %}
  | %identifier SimpleValue {% data => ({type: 'value', value: `${data[0].value}${data[1].value}`, col: data[0].col}) %}
  | %identifier {% data => ({type: 'value', value: data[0].value, col: data[0].col}) %}
  | %value {% data => ({type: 'value', value: `${data[0]}`, col: data[0].col}) %}


_ -> %ws:* {% () => null %}
__ -> %ws
