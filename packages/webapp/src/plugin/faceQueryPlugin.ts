import type { TAst, TPlugin, TPluginManager, TQueryAst, TQueryContext, TQueryPlugin } from "@home-gallery/types";

const FaceQueryPlugin: TPlugin = {
  name: 'default',
  version: '1.0',
  async initialize(manager: TPluginManager) {
    manager.register('query', faceQuery)
  }
}

export default FaceQueryPlugin

const faceQuery: TQueryPlugin = {
  name: 'face',
  transformRules: [{
    types: ['query'],
    transform(ast, context) {
      const { database: { entries }, face } = context.plugin
      if (!face?.id || !entries?.findAll().length) {
        return ast
      }

      const orderKey: TAst = {type: 'orderKey', key: 'face', col: ast.col}
      const orderBy: TAst = ast.orderBy ? ast.orderBy : {type: 'orderBy', value: orderKey, direction: 'asc', col: ast.col}
      const text: TAst = {type: 'text', value: face?.id, col: ast.col}
      const cmp: TAst = {type: 'cmp', key: 'face', op: '=', value: text, col: ast.col}

      if (ast.value?.type == 'noop') {
        // empty query
        return {...ast, value: cmp, orderBy}
      }

      const and: TAst = {type: 'and', value: [cmp, ast.value as TAst], col: ast.col}
      return {...ast, value: and, orderBy}
    }
  },{
    // Convert face:id => face = id
    types: ['keyValue'],
    keys: ['face'],
    transform(ast, context) {
      const valueAst = ast.value as TAst
      const value = {type: 'text', value: ast.value?.value || '', col: valueAst.col} as TAst
      return {...ast, type: 'cmp', op: '=', value}
    }
  },{
    types: ['cmp'],
    keys: ['face'],
    ops: ['='],
    transform(ast, context) {
      if (!context.plugin.database) {
        return ast
      }
      const { database: { entries } } = context.plugin
      if (!entries.findAll().length) {
        return ast
      }
      const [id, faceIndex] = (ast.value?.value || '').split('.')
      const face = (entries?.findAllByIdPrefix?.(id) || [])
        .filter(e => e.faces?.length && +faceIndex < e.faces?.length)
        .map(e => e.faces[+faceIndex])
        .shift()
      if (!face?.descriptor) {
        return ast
      }

      return {...ast, face}
    }
  }],
  queryHandler(ast: TQueryAst, context: TQueryContext, reason: string) {
    return handleFaceCmp(ast, context) || handleFaceOrder(ast, context)
  }
}

function handleFaceCmp(ast: TQueryAst, context: TQueryContext): boolean {
  if (ast.type != 'cmp' || ast.key != 'face' || ast.op != '=') {
    return false
  }
  if (!context.plugin.face?.scores) {
    context.plugin.face = {
      ...context.plugin.face,
      scores: new WeakMap<any, number>()
    }
  }
  const face = ast.face
  const scores = context.plugin.face.scores as WeakMap<any, number>
  ast.filter = entry => {
    if (!entry.faces?.length || !face) {
      return false
    }
    
    const entryScore = entry.faces.map(f => {
      return euclideanDistance(f.descriptor, face.descriptor)
    }).reduce((min, distance) => Math.min(min, distance))

    scores.set(entry, entryScore)
    return entryScore < 0.55
  }
  return true
}

function handleFaceOrder(ast: TQueryAst, context: TQueryContext): boolean {
  if (ast.type != 'orderKey' || ast.key != 'face') {
    return false
  }
  const scores = context.plugin.face?.scores
  ast.scoreFn = entry => {
    return scores?.get(entry) || 0
  }
  return true
}

const euclideanDistance = (a, b) => {
  const max = Math.min(a.length, b.length)
  let result = 0
  for (let i = 0; i < max; i++) {
    const diff = a[i] - b[i]
    result += diff * diff
  }
  return Math.sqrt(result)
}
