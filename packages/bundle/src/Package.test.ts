import fs from 'fs/promises'
import path from 'path'
import t from 'tap'
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

import { Package } from './Package.js'

const testDir = path.resolve(__dirname, '..', 'test')

const isWindows = process.platform == 'win32'
const toPosixPath = (f: string) => isWindows ? f.split(path.sep).join(path.posix.sep) : f

const moduleFrom = async (dir: string) => {
  const pkg = await fs.readFile(path.join(dir, 'package.json'), 'utf8').then(JSON.parse)
  return new Package(dir, pkg)
}

t.test('Package class', async t => {
  let module = await moduleFrom(path.join(testDir, 'walk'))
  t.same((await module.files()).map(toPosixPath), [
    'package.json'
  ])

  module = await moduleFrom(path.join(testDir, 'walk', 'node_modules', 'a'))
  t.same((await module.files()).map(toPosixPath), [
    'dist/index.js',
    'src/index.js',
    'README',
    'package.json'
  ], 'src/index.js should be included default')

  module = await moduleFrom(path.join(testDir, 'walk', 'node_modules', 'a'))
  t.same((await module.files(true)).map(toPosixPath), [
    'dist/index.js',
    'README',
    'package.json'
  ], 'src/index.js should be exclued file entry filter')

  module = await moduleFrom(path.join(testDir, 'package', 'dir-pattern'))
  t.same((await module.files(true)).map(toPosixPath), [
    'lib/index.js',
    'package.json'
  ], 'lib/index.js should be included by "lib" file entry')

  module = await moduleFrom(path.join(testDir, 'package', 'tailing-slash'))
  t.same((await module.files(true)).map(toPosixPath), [
    'lib/index.js',
    'package.json'
  ], 'lib/index.js should be included by "lib/" file entry')

  t.test('match platform arch', async t => {
    module = new Package('.', {})
    t.same(module.matchesPlatformArch(undefined, undefined), true, 'nothing should match')
    t.same(module.matchesPlatformArch('linux', undefined), true, 'nothing should match for platform linux')
    t.same(module.matchesPlatformArch(undefined, 'x64'), true, 'nothing should match for platform x64')

    module = new Package('.', {os: ['linux']})
    t.same(module.matchesPlatformArch(undefined, undefined), true, 'only linux: no platform should match')
    t.same(module.matchesPlatformArch('linux', undefined), true, 'only linux: platform linux should match')
    t.same(module.matchesPlatformArch('win32', undefined), false, 'only linux: platform win32 should not match')

    module = new Package('.', {os: ['!win32']})
    t.same(module.matchesPlatformArch(undefined, undefined), true, 'no win32: no platform should match')
    t.same(module.matchesPlatformArch('linux', undefined), true, 'no win32: platform linux should match')
    t.same(module.matchesPlatformArch('win32', undefined), false, 'no win32: platform win32 should not match')

    module = new Package('.', {os: ['linux', '!win32']})
    t.same(module.matchesPlatformArch(undefined, undefined), true, 'only linux no win32: no platform should match')
    t.same(module.matchesPlatformArch('linux', undefined), true, 'only linux no win32: platform linux should match')
    t.same(module.matchesPlatformArch('darwin', undefined), false, 'only linux no win32: platform darwin should not match')
    t.same(module.matchesPlatformArch('win32', undefined), false, 'only linux no win32: platform win32 should not match')

    module = new Package('.', {cpu: ['x64', '!arm7']})
    t.same(module.matchesPlatformArch(undefined, undefined), true, 'only x64 no arm7: no arch should match')
    t.same(module.matchesPlatformArch(undefined, 'x64'), true, 'only x64 no arm7: arch x64 should match')
    t.same(module.matchesPlatformArch(undefined, 'arm64'), false, 'only x64 no arm7: arch arm64 should not match')
    t.same(module.matchesPlatformArch(undefined, 'arm7'), false, 'only x64 no arm7: arch arm7 should not match')

    module = new Package('.', {os: ['linux', 'darwin'], cpu: ['!arm7']})
    t.same(module.matchesPlatformArch('linux', 'arm64'), true, 'only linux/darwin no arm7: should match linux arm64')
    t.same(module.matchesPlatformArch('darwin', 'm1'), true, 'only linux/darwin no arm7: should match darwin m1')
    t.same(module.matchesPlatformArch('win64', 'x64'), false, 'only linux/darwin no arm7: should not match win64 x64')
    t.same(module.matchesPlatformArch('linux', 'arm7'), false, 'only linux/darwin no arm7: should not match linux arm7')
  })
})

