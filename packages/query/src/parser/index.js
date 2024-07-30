import nearley from "nearley"
import grammar from "./grammar.js"

const parseCb = (text, cb) => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))

  try {
    parser.feed(text)
  } catch (err) {
    return cb(err)
  }

  if (parser.results.length) {
    const ast = parser.results[parser.results.length - 1]
    cb(null, ast)
  } else {
    cb(new Error(`Empty results for query ${text}`))
  }
}

const emptyQuery = {
  type: 'query',
  value: {
    type: 'noop',
    col: 0
  },
  col: 0
}

export const parse = async (text) => {
  if (!text?.trim().length) {
    return emptyQuery
  }
  return new Promise((resolve, reject) => {
    parseCb(text, (err, ast) => {
      if (err) {
        return reject(err)
      }
      resolve(ast)
    })
  })
}