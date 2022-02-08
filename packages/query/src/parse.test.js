const t = require('tap')
const { parse: parseCb } = require('./parse')

const parse = query => new Promise((resolve, reject) => {
  parseCb(query, (err, result) => err ? reject(err) : resolve(result))
})

const stringifyAst = ast => {
  if (ast.type == 'query') {
    return `${stringifyAst(ast.value)}${ast.sortBy ? ` sortBy(${ast.sortBy})` : ''}`
  } else if (ast.type == 'terms') {
    return `terms(${ast.value.map(stringifyAst).join(', ')})`
  } else if (ast.type == 'paren') {
    return `(${stringifyAst(ast.value)})`
  } else if (ast.type == 'value') {
    return `${ast.value}`
  } else if (ast.type == 'text') {
    return `"${ast.value}"`
  } else if (ast.type == 'not') {
    return `not(${stringifyAst(ast.value)})`
  } else if (ast.type == 'or') {
    return `or(${stringifyAst(ast.left)}, ${stringifyAst(ast.right)})`
  } else if (ast.type == 'and') {
    return `and(${stringifyAst(ast.left)}, ${stringifyAst(ast.right)})`
  } else if (ast.type == 'cmp') {
    return `${ast.key} ${ast.op} ${stringifyAst(ast.value)}`
  } else if (ast.type == 'in') {
    return `${ast.key} in ${stringifyAst(ast.value)}`
  } else if (ast.type == 'list') {
    return `(${ast.value.map(stringifyAst).join(', ')})`
  } else if (ast.type == 'range') {
    return `[${stringifyAst(ast.from)} : ${stringifyAst(ast.to)}]`
  } else {
    return `!unknown type ${ast.type}: ${JSON.stringify(ast)}!`
  }
}

const simpleAst = query => parse(query).then(stringifyAst)

t.test('Keywords', async t => {
  t.test('Without space are values', async t => {
    t.equal(await simpleAst('or'), 'or')
    t.equal(await simpleAst('and'), 'and')
    t.equal(await simpleAst('not'), 'not')
    t.equal(await simpleAst('in'), 'in')
    t.equal(await simpleAst('sort by'), 'terms(sort, by)')
  })

  t.test('With space are keywords', async t => {
    t.test('or ', async t => t.rejects(parse('or ')))
    t.test('and ', async t => t.rejects(parse('and ')))
    t.test('not ', async t => t.rejects(parse('not ')))
    t.test('in ', async t => t.rejects(parse('in ')))
    t.test('sort by ', async t => t.rejects(parse('sort by ')))
  })

  t.test('escaped or', async t => t.resolves(parse('"or"')))
  t.test('escaped and', async t => t.resolves(parse('"and"')))
  t.test('escaped not', async t => t.resolves(parse('"not"')))
  t.test('escaped in', async t => t.resolves(parse('"in"')))
  t.test('escaped sort by', async t => t.equal(await simpleAst('foo "sort by" bar'), 'terms(foo, "sort by", bar)'))
})

t.test('Simple term', async t => {
  t.test('One Term', async t => {
    t.equal(await simpleAst('foo'), 'foo')
  })

  t.test('Two terms', async t => {
    t.equal(await simpleAst('foo bar'), 'terms(foo, bar)')
  })

  t.test('Three terms', async t => {
    t.equal(await simpleAst('foo bar baz'), 'terms(foo, bar, baz)')
  })

  t.test('Double quoted term', async t => {
    t.equal(await simpleAst('"foo bar"'), '"foo bar"')
  })

  t.test('Single quoted term', async t => {
    t.equal(await simpleAst("'foo bar'"), '"foo bar"')
  })

  t.test('Term with and keyword prefix', async t => {
    t.equal(await simpleAst("andrea"), 'andrea')
  })

  t.test('Term with or keyword prefix', async t => {
    t.equal(await simpleAst("organic"), 'organic')
  })

  t.test('Term with not keyword prefix', async t => {
    t.equal(await simpleAst("nottingham"), 'nottingham')
  })

  t.test('Term with in keyword prefix', async t => {
    t.equal(await simpleAst("india"), 'india')
  })

})

t.test('Parenthesis', async t => {
  t.test('One Term', async t => {
    t.equal(await simpleAst('(foo)'), '(foo)')
  })

  t.test('Two terms', async t => {
    t.equal(await simpleAst('(foo) (bar)'), 'terms((foo), (bar))')
  })

  t.test('Cascaded', async t => {
    t.equal(await simpleAst('(foo (bar))'), '(terms(foo, (bar)))')
  })
})

t.test('Not Expression', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('not foo'), 'not(foo)')
  })

  t.test('Double', async t => {
    t.equal(await simpleAst('not not foo'), 'not(not(foo))')
  })

  t.test('Parenthesis', async t => {
    t.equal(await simpleAst('not (foo)'), 'not((foo))')
  })

  t.test('Parenthesis before', async t => {
    t.equal(await simpleAst('(foo) not baz'), 'terms((foo), not(baz))')
  })

  t.test('Parenthesis after', async t => {
    t.equal(await simpleAst('not foo (baz)'), 'terms(not(foo), (baz))')
  })

  t.test('Cascaded Parenthesis', async t => {
    t.equal(await simpleAst('not (foo baz)'), 'not((terms(foo, baz)))')
  })
})

t.test('Or Expression', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo or baz'), 'or(foo, baz)')
  })
})

t.test('And Expression', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo and baz'), 'and(foo, baz)')
  })
})

t.test('Stringify Ast', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo'), 'foo')
  })

  t.test('Simple Number', async t => {
    t.equal(await simpleAst('2020'), '2020')
  })

  t.test('Terms', async t => {
    t.equal(await simpleAst('foo bar'), 'terms(foo, bar)')
  })

  t.test('Not', async t => {
    t.equal(await simpleAst('not foo'), 'not(foo)')
  })

  t.test('And', async t => {
    t.equal(await simpleAst('foo and bar'), 'and(foo, bar)')
  })

  t.test('Or', async t => {
    t.equal(await simpleAst('foo or bar'), 'or(foo, bar)')
  })

})

t.test('Quote', async t => {
  t.test('Single', async t => {
    t.equal(await simpleAst("'foo bar'"), '"foo bar"')
  })

  t.test('Double', async t => {
    t.equal(await simpleAst('foo "bar baz"'), 'terms(foo, "bar baz")')
  })
})

t.test('Comparator', async t => {
  t.test('Greater than', async t => {
    t.equal(await simpleAst('foo > bar'), 'foo > bar')
  })

  t.test('Less or equal than', async t => {
    t.equal(await simpleAst('foo <= bar'), 'foo <= bar')
  })

  t.test('Colon', async t => {
    t.equal(await simpleAst('foo:bar'), 'foo = bar')
  })

  t.test('Colon value with whitespace', async t => {
    t.equal(await simpleAst('foo:"bar baz"'), 'foo = "bar baz"')
  })

  t.test('Equal with whitespace', async t => {
    t.equal(await simpleAst('foo = "bar baz"'), 'foo = "bar baz"')
  })

})

t.test('List', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo in (bar)'), 'foo in (bar)')
  })

  t.test('Dotted key', async t => {
    t.equal(await simpleAst('foo.bar in (baz)'), 'foo.bar in (baz)')
  })

  t.test('Text value', async t => {
    t.equal(await simpleAst('foo.bar in ( "baz baz" , "cat cat" )'), 'foo.bar in ("baz baz", "cat cat")')
  })

  t.test('Multiple', async t => {
    t.equal(await simpleAst('foo in (bar, baz)'), 'foo in (bar, baz)')
  })

  t.test('More', async t => {
    t.equal(await simpleAst('foo in (bar,baz,cat)'), 'foo in (bar, baz, cat)')
  })

  t.test('With Not', async t => {
    t.equal(await simpleAst('not foo in (bar,baz,cat)'), 'not(foo in (bar, baz, cat))')
  })
})

t.test('Range', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo in [bar:baz]'), 'foo in [bar : baz]')
  })

  t.test('Text value', async t => {
    t.equal(await simpleAst('foo in ["bar bar":"baz baz"]'), 'foo in ["bar bar" : "baz baz"]')
  })

  t.test('Parenthesis', async t => {
    t.equal(await simpleAst('(foo in [bar:baz])'), '(foo in [bar : baz])')
  })

  t.test('Whitespace', async t => {
    t.equal(await simpleAst('foo  in  [ bar  :  baz ]'), 'foo in [bar : baz]')
  })
})

t.test('Sort by', async t => {
  t.test('Simple', async t => {
    t.equal(await simpleAst('foo sort by bar'), 'foo sortBy(bar)')
  })

  t.test('Terms', async t => {
    t.equal(await simpleAst('foo bar sort by baz'), 'terms(foo, bar) sortBy(baz)')
  })
})

t.test('Complex query', async t => {
  t.test('One', async t => {
    t.equal(await simpleAst('not (foo > bar) (baz or cat)'), 'terms(not((foo > bar)), (or(baz, cat)))')
  })

  t.test('Two', async t => {
    t.equal(await simpleAst('not (foo > bar) (baz or cat in (a, 2, c))'), 'terms(not((foo > bar)), (or(baz, cat in (a, 2, c))))')
  })

  t.test('Three', async t => {
    t.equal(await simpleAst('(2021) not foo'), 'terms((2021), not(foo))')
  })

  t.test('Four', async t => {
    t.equal(await simpleAst('(2021) not foo in [  2021 : 2023]'), 'terms((2021), not(foo in [2021 : 2023]))')
  })

})
