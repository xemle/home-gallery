import path from 'path'
import t from 'tap'
import { PackageReolver } from './PackageResolver'

const testDir = path.resolve(__dirname, '..', 'test')

const isWindows = process.platform == 'win32'
const toPosixPath = (f: string) => isWindows ? f.split(path.sep).join(path.posix.sep) : f

const relativePackageDirs = (resolver: PackageReolver) => resolver.packages.map(p => path.relative(resolver.baseDir, p.dir)).map(toPosixPath)

const relativePackageFiles = async (resolver: PackageReolver) => (await resolver.files).map(f => path.relative(resolver.baseDir, f)).map(toPosixPath)

t.test('PackageResolver class', async t => {
  let resolver

  t.test('simple', async t => {
    resolver = new PackageReolver(path.join(testDir, 'walk'))
    await resolver.addPackage('a')
    t.same(resolver.packages.length, 1, 'Should have one package')
  })

  t.test('relative', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve'))
    await resolver.addPackage('./relative')
    t.same(resolver.packages.length, 2)
    t.same(relativePackageDirs(resolver), [
      'relative',
      'relative/packages/a',
    ], 'should load relative dependency')

    resolver = new PackageReolver(testDir)
    await resolver.addPackage('./walk')
    t.same(resolver.packages.length, 2)
    t.same(relativePackageDirs(resolver), [
      'walk',
      'walk/node_modules/a',
    ], 'should load dependency from node_module')
  })

  t.test('cyclic', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve'))
    await resolver.addPackage('./cyclic')
    t.same(resolver.packages.length, 3)
    t.same(relativePackageDirs(resolver), [
      'cyclic',
      'cyclic/node_modules/a',
      'cyclic/node_modules/b',
    ], 'should handle cyclic node modules')
  })

  t.test('depth', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve'))
    await resolver.addPackage('./depth')
    t.same(resolver.packages.length, 3)
    t.same(relativePackageDirs(resolver), [
      'depth',
      'depth/node_modules/a',
      'depth/node_modules/a/node_modules/b',
    ], 'should resolve nested dependency')
  })

  t.test('package file filter', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'auto-file-filter'))
    await resolver.addPackage('.')
    t.same(await relativePackageFiles(resolver), [
      'dist/index.js',
      'package.json',
      'node_modules/a/dist/index.js',
      'node_modules/a/src/index.js',
      'node_modules/a/README',
      'node_modules/a/package.json',
    ], 'src/index.js should be excluded by auto file filer while at node_modules/a/src/index.js file filter is not applied')

    resolver = new PackageReolver(path.join(testDir, 'resolve', 'auto-file-filter', 'node_modules', 'a'))
    await resolver.addPackage('.')
    t.same(await relativePackageFiles(resolver), [
      'dist/index.js',
      'README',
      'package.json',
    ], 'src/index.js of node_modules/a is no excluded due auto file filter')
  })

  t.test('platform specific optional', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional'))
    await resolver.addPackage('.')
    t.same(resolver.packages.length, 3)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
      'node_modules/b/package.json',
    ], 'should return all file due no filter for platform and arch given')

    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional'))
    await resolver.addPackage('.', '.', { platform: 'linux', arch: 'x64'})
    t.same(resolver.packages.length, 2)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
    ], 'should match platform linxu and arch x64')

    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional'))
    await resolver.addPackage('.', '.', { platform: 'darwin', arch: 'arm64'})
    t.same(resolver.packages.length, 2)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/b/package.json',
    ], 'should match platform darwin and arch x64')
  })

  t.test('missing optional', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional-missing'))
    await resolver.addPackage('.')
    t.same(resolver.packages.length, 2)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
    ], 'should successed with missing dependency b')
  })

  t.test('optional dependency', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional-deep'))
    await resolver.addPackage('.', '.', {platform: 'linux'})
    t.same(resolver.packages.length, 3)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
      'node_modules/b/package.json',
    ], 'should include nested dependency b of optional a')

    resolver = new PackageReolver(path.join(testDir, 'resolve', 'optional-deep'))
    await resolver.addPackage('.', '.', {platform: 'win64'})
    t.same(resolver.packages.length, 1)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
    ], 'should not have optional and nested dependency b')
  })

  t.test('required invalid platform', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'required-invalid-platform'))
    await resolver.addPackage('.', '.', {platform: 'win64'})
    t.same(resolver.packages.length, 2)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
    ], 'should include required dependency a with invalid platform')
  })

  t.test('bundle dependencies', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'bundle-dependencies'))
    await resolver.addPackage('.', '.')
    t.same(resolver.packages.length, 3)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
      'node_modules/c/package.json',
    ], 'should include required and optional selected dependencies')
  })

  t.test('bundle none dependencies', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'bundle-none-dependencies'))
    await resolver.addPackage('.', '.')
    t.same(resolver.packages.length, 1)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
    ], 'should not include further dependencies')
  })

  t.test('bundle all dependencies', async t => {
    resolver = new PackageReolver(path.join(testDir, 'resolve', 'bundle-all-dependencies'))
    await resolver.addPackage('.', '.')
    t.same(resolver.packages.length, 3)
    t.same(await relativePackageFiles(resolver), [
      'package.json',
      'node_modules/a/package.json',
      'node_modules/b/package.json',
    ], 'should include required and optional dependencies')
  })

})

