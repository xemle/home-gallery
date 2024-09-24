import { TAst, TPlugin, TPluginManager, TQueryAst, TQueryContext, TQueryPlugin, TAstTransformRule } from "@home-gallery/types";

const SimilarQueryPlugin: TPlugin = {
  name: 'default',
  version: '1.0',
  async initialize(manager: TPluginManager) {
    manager.register('query', similarQuery)
  }
}

export default SimilarQueryPlugin

const addSeedFromContext: TAstTransformRule = {
  types: ['query'],
  transform(ast, context) {
    const { similar } = context.plugin;
    if (!similar?.seedId) {
      return ast;
    }

    const text: TAst = { type: 'text', value: similar?.seedId, col: ast.col };
    const cmp: TAst = { type: 'cmp', key: 'similar', op: '=', value: text, col: ast.col };

    if (ast.value?.type == 'noop') {
      // empty query
      return { ...ast, value: cmp };
    }

    const and: TAst = { type: 'and', value: [cmp, ast.value as TAst], col: ast.col };
    return { ...ast, value: and };
  }
}

const setOrderBySimilar: TAstTransformRule = {
  types: ['query'],
  transform(ast, context) {
    if (ast.orderBy || !hasSimilar(ast)) {
      return ast;
    }

    const orderKey: TAst = { type: 'orderKey', key: 'similar', col: ast.col };
    const orderBy: TAst = ast.orderBy ? ast.orderBy : { type: 'orderBy', value: orderKey, direction: 'desc', col: ast.col };
    return { ...ast, orderBy };
  }
}

const mapSimilarKeyValue: TAstTransformRule = {
  types: ['keyValue'],
  keys: ['similar'],
  transform(ast, context) {
    const valueAst = ast.value as TAst;
    const value = { type: 'text', value: ast.value?.value || '', col: valueAst.col } as TAst;
    return { ...ast, type: 'cmp', op: '=', value };
  }
}

const similarQuery: TQueryPlugin = {
  name: 'similar',
  transformRules: [
    addSeedFromContext,
    setOrderBySimilar,
    mapSimilarKeyValue
  ],
  queryHandler(ast: TQueryAst, context: TQueryContext, reason: string) {
    return handleSimilarCmp(ast, context) || handleSimilarOrder(ast, context)
  }
}

type TSeedScores = {
  id: string
  similarityHash: string
  scores: WeakMap<any, number>
}

function handleSimilarCmp(ast: TQueryAst, context: TQueryContext): boolean {
  if (ast.type != 'cmp' || ast.key != 'similar' || ast.op != '=') {
    return false
  }
  let seed = getSeedScore(ast, context)
  if (!seed.similarityHash) {
    ast.filter = () => false
    return true
  }

  ast.filter = entry => {
    if (!entry.similarityHash) {
      return false
    }
    const similar = cosineSimilarity(entry.similarityHash, seed.similarityHash)
    if (similar < 0.5) {
      return false
    }

    seed.scores.set(entry, similar)
    return true
  }
  return true
}

function getSeedScore(ast: TQueryAst, context: TQueryContext): TSeedScores {
  const { database: { entries } } = context.plugin
  const seedId = ast.value?.value || '';
  const similarityHash = (entries?.findAllByIdPrefix?.(seedId) || [])
    .filter(e => e.similarityHash)
    .map(e => e.similarityHash)
    .shift();

  const scores = context.plugin.similar?.scores || []
  let score = scores.find(seed => seed.id == seedId)
  if (score) {
    return score
  }

  score = {
    id: seedId,
    similarityHash,
    scores: new WeakMap<any, number>()
  };
  scores.push(score);
  context.plugin.similar = {
    ...context.plugin.similar,
    scores: scores
  }
  return score
}

function handleSimilarOrder(ast: TQueryAst, context: TQueryContext): boolean {
  if (ast.type != 'orderKey' || ast.key != 'similar') {
    return false
  }
  const scores: TSeedScores[] = context.plugin.similar?.scores || []
  ast.scoreFn = entry => {
    let max = 0
    for (let i = 0; i < scores.length; i++) {
      max = Math.max(max, scores[i].scores.get(entry) || 0)
    }
    return max
  }
  return true
}

/**
 * @param {string} a Similarity vector in base64
 * @param {string} b Similarity vector in base64
 * @returns {number}
 */
const cosineSimilarity = (a: string, b: string) => {
  let denA = 0
  let denB = 0
  let num = 0
  for (let i = 0; i < a.length; i++) {
    let ai = base64Value(a.charCodeAt(i))
    let bi = base64Value(b.charCodeAt(i))
    for (let j = 0; j < 3; j++) {
      let av = (ai & 3)
      let bv = (bi & 3)
      av = av * av / 9
      bv = bv * bv / 9
      num += av * bv
      denA += av * av
      denB += bv * bv

      ai = (ai >> 2)
      bi = (bi >> 2)
    }
  }

  return num / (Math.sqrt(denA) * Math.sqrt(denB))
}

const base64Value = (i: number) => {
  if (i >= 65 && i <= 90) { // A-Z, A = 0 (base64), A = 65 ascci
    return i - 65
  } else if (i >= 97 && i <= 122) { // a-z, a = 26 (base64), a = 97 ascci
    return i - 71 // 97 - 26
  } else if (i >= 48 && i <= 57) { // 0-9, 0 = 52 (base64), 0 = 48 ascci
    return i + 4 // 52 - 48
  } else if (i == 43) { // + = 62 (base64)
    return 62
  } else if (i == 47) { // / = 63 (base64)
    return 63
  } else {
    return 0
  }
}

const isAst = (ast: any) => ast.type && (ast.col || ast.col === 0)

function walkAst(ast: any, cb: (ast: TAst) => void) {
  if (!isAst(ast)) {
    return
  }
  cb(ast)
  if (Array.isArray(ast.value)) {
    ast.value.forEach(child => walkAst(child, cb))
  } else if (ast.value) {
    walkAst(ast.value, cb)
  }
  if (ast.orderBy) {
    walkAst(ast.orderBy, cb)
  }
}

function hasSimilar(ast: TAst) {
  let found = false
  walkAst(ast, ast => {
    if (ast.type == 'cmp' && ast.key == 'similar' && ast.op == '=') {
      found = true
    } else if (ast.type == 'keyValue' && ast.key == 'similar') {
      found = true
    }
  })
  return found
}

