import t from 'tap'

import { SemVer } from './SemVer.js'

t.only('SemVer', async t => {
  t.test('basic', async t => {
    const semVer = new SemVer('1.3')

    t.same(semVer.major, 1)
    t.same(semVer.minor, 3)
    t.same(semVer.patch, 0)

    t.same(semVer.versionDepth, 2)
    t.same(semVer.toString(), '1.3')
  })

  t.test('zero major', async t => {
    const semVer = new SemVer('0.1.3')

    t.same(semVer.major, 0)
    t.same(semVer.minor, 1)
    t.same(semVer.patch, 3)

    t.same(semVer.versionDepth, 3)
    t.same(semVer.toString(), '0.1.3')
  })

  t.test('gt', async t => {
    t.same(new SemVer('1').gt(new SemVer('0')), true)
    t.same(new SemVer('1').gt(new SemVer('1')), false)
    t.same(new SemVer('1').gt(new SemVer('2')), false)

    t.same(new SemVer('1.3').gt(new SemVer('0')), true)
    t.same(new SemVer('1.3').gt(new SemVer('1')), false)
    t.same(new SemVer('1.3').gt(new SemVer('1.2')), true)
    t.same(new SemVer('1.3').gt(new SemVer('1.3')), false)
    t.same(new SemVer('1.3').gt(new SemVer('1.4')), false)

    t.same(new SemVer('1.3.2').gt(new SemVer('1.3')), false)
    t.same(new SemVer('1.3.2').gt(new SemVer('1.3.1')), true)
    t.same(new SemVer('1.3.2').gt(new SemVer('1.3.2')), false)
    t.same(new SemVer('1.3.2').gt(new SemVer('1.3.4')), false)
  })

  t.test('ge', async t => {
    t.same(new SemVer('1').ge(new SemVer('0')), true)
    t.same(new SemVer('1').ge(new SemVer('1')), true)
    t.same(new SemVer('1').ge(new SemVer('2')), false)

    t.same(new SemVer('1.3').ge(new SemVer('0')), true)
    t.same(new SemVer('1.3').ge(new SemVer('1')), true)
    t.same(new SemVer('1.3').ge(new SemVer('1.1')), true)
    t.same(new SemVer('1.3').ge(new SemVer('1.3')), true)
    t.same(new SemVer('1.3').ge(new SemVer('1.3.1')), true)
    t.same(new SemVer('1.3').ge(new SemVer('1.4')), false)
    t.same(new SemVer('1.3').ge(new SemVer('2')), false)

    t.same(new SemVer('1.3.2').ge(new SemVer('0')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.1')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.3')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.3.1')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.3.2')), true)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.3.4')), false)
    t.same(new SemVer('1.3.2').ge(new SemVer('1.4')), false)
    t.same(new SemVer('1.3.2').ge(new SemVer('2')), false)

  })

  t.test('isCompatible', async t => {
    const semVer = new SemVer('1.3')

    t.same(new SemVer('1.3').isCompatible(new SemVer('0')), false)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1')), true)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1.1')), true)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1.3')), true)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1.3.2')), true)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1.4')), false)
    t.same(new SemVer('1.3').isCompatible(new SemVer('1.4.2')), false)
  })


})