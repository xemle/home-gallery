import path from 'path'
import t from 'tap'

import { walkDir } from './walk'
import picomatch from 'picomatch'

const dir = path.resolve(__dirname, '..', 'test', 'walk')

t.test('walkDir', async t => {
  t.same(await walkDir(dir, '.', () => true), [
    'node_modules/a/dist/index.js', 
    'node_modules/a/src/index.js', 
    'node_modules/a/README',
    'node_modules/a/package.json',
    'package.json'
  ])

  const aDir = path.join(dir, 'node_modules', 'a')
  t.same(await walkDir(aDir, '.', picomatch(['package.json', 'dist/**'])), [
    'dist/index.js',
    'package.json',
  ])

})

