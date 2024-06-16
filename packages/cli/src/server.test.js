import t from 'tap'
import yargs from 'yargs'

t.test('yargs', async t => {
  t.test('explicit option is set', async t => {
    const argv = yargs()
    .options({
      'port': { alias: ['p'], number: true }
    })
    .default('port', undefined, '3000')
    .parse(['-p', '3001'])

    t.match(argv.port, 3001)
  })

  // Use .default(key, value, description) to catch default values
  // See https://github.com/xemle/home-gallery/issues/69
  // See https://yargs.js.org/docs/#api-reference-defaultkey-value-description
  // See https://github.com/yargs/yargs/issues/513
  t.test('default value is undefined', async t => {
    const argv = yargs()
    .options({
      'port': { alias: ['p'], number: true }
    })
    .default('port', undefined, '3000')
    .parse([])

    t.match(argv.port, undefined)
  })

})
