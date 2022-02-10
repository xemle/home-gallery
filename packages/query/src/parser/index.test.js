const t = require('tap')

const { stringifyAst } = require('../ast')
const { parse: parseCb } = require('./index')

const parse = query => new Promise((resolve, reject) => {
  parseCb(query, (err, result) => err ? reject(err) : resolve(result))
})

const simpleAst = query => parse(query).then(stringifyAst)

t.test('Keywords', async t => {
  t.test('with space are keywords', async t => {
    t.rejects(parse('or '), 'or')
    t.rejects(parse('and '), 'and')
    t.rejects(parse('not '), 'not')
    t.rejects(parse('in '), 'int')
    t.rejects(parse('order '), 'order')
    t.rejects(parse('by '), 'by')
    t.rejects(parse('count '), 'count')
    t.rejects(parse('asc '), 'asc')
    t.rejects(parse('desc '), 'desc')
  })

  t.test('escaped', async t => {
    t.resolves(parse('"or"'), 'or')
    t.resolves(parse('"and"'), 'and')
    t.resolves(parse('"not"'), 'not')
    t.resolves(parse('"in"'), 'in')
    t.equal(await simpleAst('foo "order" bar'), 'terms(foo, "order", bar)', 'order')
    t.equal(await simpleAst('foo "by" bar'), 'terms(foo, "by", bar)', 'by')
  })
})

t.test('Simple term', async t => {
  t.equal(await simpleAst('foo'), 'foo', 'one term')
  t.equal(await simpleAst('foo bar'), 'terms(foo, bar)', 'Two terms')
  t.equal(await simpleAst('foo bar baz'), 'terms(foo, bar, baz)', 'Three terms')
  t.equal(await simpleAst('"foo bar"'), '"foo bar"', 'Double quoted term')
  t.equal(await simpleAst("'foo bar'"), '"foo bar"', 'Single quoted term')

  t.equal(await simpleAst("andrea"), 'andrea', 'Term with and keyword prefix')
  t.equal(await simpleAst("organic"), 'organic', 'Term with or keyword prefix')
  t.equal(await simpleAst("nottingham"), 'nottingham', 'Term with not keyword prefix')
  t.equal(await simpleAst("india"), 'india', 'Term with in keyword prefix')
})

t.test('Parenthesis', async t => {
  t.equal(await simpleAst('(foo)'), '(foo)', 'One Term')
  t.equal(await simpleAst('( foo)'), '(foo)', 'One Term with leading witespace')
  t.equal(await simpleAst('(foo )'), '(foo)', 'One Term with tailing witespace')
  t.equal(await simpleAst('( foo )'), '(foo)', 'One Term with witespace')
  t.equal(await simpleAst('(foo) (bar)'), 'terms((foo), (bar))', 'Two terms')
  t.equal(await simpleAst('(foo (bar))'), '(terms(foo, (bar)))', 'Cascaded')
})

t.test('Not Expression', async t => {
  t.equal(await simpleAst('not foo'), 'not(foo)', 'Simple')
  t.equal(await simpleAst('NOT foo'), 'not(foo)', 'Capitalized')
  t.equal(await simpleAst('not not foo'), 'not(not(foo))', 'Double')
  t.equal(await simpleAst('not (foo)'), 'not(foo)', 'Parenthesis')
  t.equal(await simpleAst('not(foo)'), 'not(foo)', 'Parenthesis')
  t.equal(await simpleAst('(foo) not baz'), 'terms((foo), not(baz))', 'Parenthesis before')
  t.equal(await simpleAst('not foo (baz)'), 'terms(not(foo), (baz))', 'Parenthesis after')
  t.equal(await simpleAst('not (foo baz)'), 'not(terms(foo, baz))', 'Cascaded Parenthesis')
})

t.test('Or Expression', async t => {
  t.equal(await simpleAst('foo or baz'), 'or(foo, baz)', 'Simple')
  t.equal(await simpleAst('foo OR baz'), 'or(foo, baz)', 'Capitalized')
})

t.test('And Expression', async t => {
  t.equal(await simpleAst('foo and baz'), 'and(foo, baz)', 'Simple')
  t.equal(await simpleAst('foo AND baz'), 'and(foo, baz)', 'Capitalized')
})

t.test('Stringify Ast', async t => {
  t.equal(await simpleAst('foo'), 'foo', 'Simple')
  t.equal(await simpleAst('2020'), '2020', 'Simple Number')
  t.equal(await simpleAst('foo bar'), 'terms(foo, bar)', 'Terms')
  t.equal(await simpleAst('not foo'), 'not(foo)', 'Not')
  t.equal(await simpleAst('foo and bar'), 'and(foo, bar)', 'And')
  t.equal(await simpleAst('foo or bar'), 'or(foo, bar)', 'Or')
})

t.test('Quote', async t => {
  t.equal(await simpleAst("'foo bar'"), '"foo bar"', 'Single')
  t.equal(await simpleAst('foo "bar baz"'), 'terms(foo, "bar baz")', 'Double')
})

t.test('Comparator', async t => {
  t.equal(await simpleAst('foo > bar'), 'foo > bar', 'Greater than')
  t.equal(await simpleAst('foo <= bar'), 'foo <= bar', 'Less or equal than')
  t.equal(await simpleAst('foo:bar'), 'foo:bar', 'Colon')
  t.equal(await simpleAst('foo:"bar baz"'), 'foo:"bar baz"', 'Colon value with whitespace')
  t.equal(await simpleAst('foo = "bar baz"'), 'foo = "bar baz"', 'Equal with whitespace')
})

t.test('Function', async t => {
  t.equal(await simpleAst('count( foo ) > bar'), 'count(foo) > bar', 'Simple')
  t.equal(await simpleAst('COUNT( foo ) > bar'), 'count(foo) > bar', 'Simple capitalized')

  t.equal(await simpleAst('exists( foo )'), 'exists(foo)', 'exists')
})

t.test('List', async t => {
  t.equal(await simpleAst('foo in (bar)'), 'foo in (bar)', 'Simple')
  t.equal(await simpleAst('foo IN (bar)'), 'foo in (bar)', 'Capitalized')
  t.equal(await simpleAst('foo all in (bar)'), 'foo all in (bar)', 'All in')
  t.equal(await simpleAst('foo ALL IN (bar)'), 'foo all in (bar)', 'All in capitalized')
  t.rejects(simpleAst('foo all IN (bar)'), 'Invalid all in')
  t.rejects(simpleAst('foo ALL in (bar)'), 'Invalid all in other way')
  t.equal(await simpleAst('foo.bar in (baz)'), 'foo.bar in (baz)', 'Dotted key')
  t.equal(await simpleAst('foo.bar in ( "baz baz" , "cat cat" )'), 'foo.bar in ("baz baz", "cat cat")', 'Text value')
  t.equal(await simpleAst('foo in (bar, baz)'), 'foo in (bar, baz)', 'Multiple')
  t.equal(await simpleAst('foo in (bar baz)'), 'foo in (bar, baz)', 'Multiple without comma')
  t.equal(await simpleAst('foo in (bar,baz,cat)'), 'foo in (bar, baz, cat)', 'More')
  t.equal(await simpleAst('foo in (bar,baz cat)'), 'foo in (bar, baz, cat)', 'More with mixed syntax')
  t.equal(await simpleAst('not foo in (bar,baz,cat)'), 'not(foo in (bar, baz, cat))', 'With Not')
})

t.test('Range', async t => {
  t.equal(await simpleAst('foo in [bar:baz]'), 'foo in [bar : baz]', 'Simple')
  t.equal(await simpleAst('foo in ["bar bar":"baz baz"]'), 'foo in ["bar bar" : "baz baz"]', 'Text value')
  t.equal(await simpleAst('(foo in [bar:baz])'), '(foo in [bar : baz])', 'Parenthesis')
  t.equal(await simpleAst('foo  in  [ bar  :  baz ]'), 'foo in [bar : baz]', 'Whitespace')
})

t.test('Order by', async t => {
  t.equal(await simpleAst('foo order by bar'), 'foo orderBy(bar)', 'Simple')
  t.equal(await simpleAst('foo order by bar asc'), 'foo orderBy(bar asc)', 'Simple asc')
  t.equal(await simpleAst('foo order by bar desc'), 'foo orderBy(bar desc)', 'Simple desc')
  t.equal(await simpleAst('foo order by count(bar)'), 'foo orderBy(count(bar))', 'count function')
  t.equal(await simpleAst('foo order by count(bar) asc'), 'foo orderBy(count(bar) asc)', 'count function asc')
  t.equal(await simpleAst('foo order by count(bar) ASC'), 'foo orderBy(count(bar) asc)', 'count function asc capitalized')
  t.equal(await simpleAst('foo order by count(bar) desc'), 'foo orderBy(count(bar) desc)', 'count function desc')
  t.equal(await simpleAst('foo order by count(bar) DESC'), 'foo orderBy(count(bar) desc)', 'count function desc capitalized')

  t.equal(await simpleAst('foo ORDER BY bar'), 'foo orderBy(bar)', 'Capitalized')
  t.equal(await simpleAst('foo bar order by baz'), 'terms(foo, bar) orderBy(baz)', 'Terms')
  t.rejects(simpleAst('foo bar order baz'), 'Invalid order by versions: sort')
  t.rejects(simpleAst('foo bar by baz'), 'Invalid order by versions: by')
  t.rejects(simpleAst('foo bar ORDER by baz'), 'Invalid order by versions: ORDER by')
  t.rejects(simpleAst('foo bar order BY baz'), 'Invalid order by versions: order BY')
  t.equal(await simpleAst('foo bar "sort" baz'), 'terms(foo, bar, "sort", baz)', 'Escaped sort keyword')
  t.equal(await simpleAst('foo bar "by" baz'), 'terms(foo, bar, "by", baz)', 'Escaped by keyword')

  t.equal(await simpleAst('order by foo'), 'orderBy(foo)', 'Empty filter, only order by')
})

t.test('Complex query', async t => {
  t.equal(await simpleAst('not (foo > bar) (baz or cat)'), 'terms(not(foo > bar), (or(baz, cat)))', 'One')
  t.equal(await simpleAst('not (foo > bar) (baz or cat in (a, 2, c))'), 'terms(not(foo > bar), (or(baz, cat in (a, 2, c))))', 'Two')
  t.equal(await simpleAst('(2021) not foo'), 'terms((2021), not(foo))', 'Three')
  t.equal(await simpleAst('(2021) not foo in [  2021 : 2023]'), 'terms((2021), not(foo in [2021 : 2023]))', 'Four')
})
