import { traverseAst } from '../ast/index.js'
import { cmpFilter } from './cmp-filter.js'
import { cmpFnFilter } from './cmp-fn-filter.js'
import { existsFnFilter } from './exists-filter.js'
import { inListFilter } from './in-list-filter.js'
import { allInFilter } from './all-in-filter.js'
import { valueFilter } from './value-filter.js'
import { orderBy, orderByKey, orderByFn, sortBy } from './order-by.js'

export const createFilterMapSort = (ast, context) => {
  traverseAst(ast, {after: ast => filterAndSortVisitor(ast, context)})

  return [ast.filter, ast.mapper, ast.sort]
}

export const filterAndSortVisitor = (ast, context) => {
  switch (ast.type) {
    case 'query': handleQuery(ast); break
    case 'paren': ast.filter = ast.value.filter; break;
    case 'or': ast.filter = v => !!ast.value.find(c => c.filter(v)); break;
    case 'terms':
    case 'and': ast.filter = v => !ast.value.find(c => !c.filter(v)); break;
    case 'not': ast.filter = v => !ast.value.filter(v); break;
    case 'cmp': cmpFilter(ast, context); break;
    case 'cmpFn': cmpFnFilter(ast, context); break;
    case 'existsFn': existsFnFilter(ast, context); break;
    case 'inList': inListFilter(ast, context); break;
    case 'allIn': allInFilter(ast, context); break;
    case 'identifier':
    case 'value':
    case 'text':
    case 'comboundValue': valueFilter(ast, context); break;

    case 'orderBy': orderBy(ast, context); break;
    case 'orderKey': orderByKey(ast, context); break;
    case 'orderFn': orderByFn(ast, context); break;

    case 'noop': ast.filter = () => true; break;

    default:
      ast.filter = () => true;
      ast.mapper = entry => entry;
      ast.sort = entries => entries;
      context.queryErrorHandler(ast, context)
  }
}

// Handle query root
const handleQuery = (ast) => {
  ast.filter = ast.value?.filter || (() => true)
  ast.mapper = ast.mapper || (entry => entry)
  ast.sort = ast.orderBy?.sort || (entries => entries)
}