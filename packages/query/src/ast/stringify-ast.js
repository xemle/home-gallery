const { traverseAst } = require('./traverse-ast')

const stringifyOrderByAst = ast => ast ? `orderBy(${ast.type == 'sortKey' ? ast.value : `count(${ast.value})`}${ast.direction ? ` ${ast.direction}` : ''})` : ''

const stringifyAst = ast => {
  traverseAst(ast, {after: ast => {
    switch (ast.type) {
      case 'query': ast.data = [(ast.value ? ast.value.data : ''), stringifyOrderByAst(ast.orderBy)].filter(v => !!v).join(' '); break;
      case 'terms': ast.data = `terms(${ast.value.map(value => value.data).join(', ')})`; break;
      case 'paren': ast.data = `(${ast.value.data})`; break;
      case 'not': ast.data = `not(${ast.value.data})`; break;
      case 'or': ast.data = `or(${ast.value.map(value => value.data).join(', ')})`; break;
      case 'and': ast.data = `and(${ast.value.map(value => value.data).join(', ')})`; break;
      case 'keyValue': ast.data = `${ast.key}:${ast.value.data}`; break;
      case 'cmp': ast.data = `${ast.key} ${ast.op} ${ast.value.data}`; break;
      case 'cmpFn': ast.data = `${ast.fn}(${ast.key}) ${ast.op} ${ast.value.data}`; break;
      case 'existsFn': ast.data = `exists(${ast.key})`; break;
      case 'inList': ast.data = `${ast.key} in (${ast.value.map(value => value.data).join(', ')})`; break;
      case 'inRange': ast.data = `${ast.key} in [${ast.value.map(value => value.data).join(' : ')}]`; break;
      case 'allIn': ast.data = `${ast.key} all in (${ast.value.map(value => value.data).join(', ')})`; break;
      case 'text': ast.data = `"${ast.value}"`; break;
      case 'identifier':
      case 'comboundValue':
      case 'value': ast.data = `${ast.value}`; break;
      default: ast.data = `!unknown type ${ast.type}: ${JSON.stringify(ast)}!`
    }
  }})
  return ast.data
}

module.exports = {
  stringifyAst
}
