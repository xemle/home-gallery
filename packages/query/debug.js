#!/usr/bin/env node

import { parse } from './src/parser/index.js'
import { stringifyAst, transformAst, traverseAst, transformRules, simplifyRules } from './src/ast/index.js'

const argv = process.argv.slice(2)

const printAst = async text => {
  parse(text)
    .then(ast => {
      console.log(JSON.stringify(ast, null, 1))
    })
    .catch(err => {
      console.log(`Failed to parse ast:`, err)
    })
}

const traverse = async text => {
  parse(text)
    .then(ast => {
      let depth = 0 
      traverseAst(ast, {
        before(ast) {
          const ident = new Array(depth * 2).fill(' ').join('')
          console.log(`${ident}Traverse ${ast.type} at ${ast.col} {`)
          depth++
        },
        after(ast) {
          depth--
          const ident = new Array(depth * 2).fill(' ').join('')
          console.log(`${ident}}`)
        }
      })
    })
}

const stringify = async text => {
  parse(text)
    .then(ast => {
      stringifyAst(ast, {
        astErrorHandler(ast, context) {
          if (!ast.type) {
            console.log(`Invalid ast node ${JSON.stringify(ast)}`)
          } else {
            console.log(`Unhandled ast node at ${ast.col}: ${JSON.stringify(ast)}`)
          }
        }
      })
      console.log(ast.data)
    })
}

const transform = async (text, stringify) => {
  parse(text)
    .then(ast => {
      const transformed = transformAst(ast, transformRules, simplifyRules)
      if (!stringify) {
        console.log(JSON.stringify(transformed, null, 2))
        return
      }
      stringifyAst(transformed)
      console.log(transformed.data)
    })
}

if (!argv.length) {
  console.log(`${process.argv[1]} [ast|traverse|transform|transformStringify|stringify] query`)
  process.exit(1)
} else if (argv.length == 1) {
  printAst(argv[0])
} else {
  const cmd = argv[0]
  const text = argv[1]
  if ('traverse'.startsWith(cmd)) {
    traverse(text)
  } else if ('stringify'.startsWith(cmd)) {
    stringify(text)
  } else if ('transformStringify'.startsWith(cmd) && cmd.length > 'transform'.length) {
    transform(text, true)
  } else if ('transform'.startsWith(cmd)) {
    transform(text)
  } else {
    printAst(text)
  }
}
