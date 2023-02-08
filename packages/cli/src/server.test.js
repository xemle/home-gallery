const t = require('tap')
const yargs = require('yargs')

t.test('vendor yargs: deprecated parsed prop', async t => {
  t.test('defaulted is not set', async t => {
    const argv = yargs()
    .options({
      'port': { alias: ['p'], number: true }
    })
    .default('port', undefined, '3000')
    .parse(['-p', '3001'])

    t.match(argv.port, 3001)
  })

  // Use .default(key, value, description) to cache default values
  // See https://github.com/xemle/home-gallery/issues/69
  // See https://yargs.js.org/docs/#api-reference-defaultkey-value-description
  // See https://github.com/yargs/yargs/issues/513
  t.test('defaulted is set', async t => {
    const argv = yargs()
    .options({
      'port': { alias: ['p'], number: true }
    })
    .default('port', undefined, '3000')
    .parse([])

    t.match(argv.port, undefined)
  })

})
