const nearley = require("nearley")
const grammar = require("./grammar.js")

const parse = (text, cb) => {
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

module.exports = { parse }
