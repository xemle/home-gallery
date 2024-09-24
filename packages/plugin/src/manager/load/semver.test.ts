import t from 'tap'

import { SemVer } from './semver.js'

t.test('SemVer', async t => {
  t.test('complete semver', async t => {
    t.ok(new SemVer('1.2.8').matches(new SemVer('1.0.0')))
    t.ok(new SemVer('1.2.8').matches(new SemVer('1.2.2')))
    t.ok(new SemVer('1.2.8').matches(new SemVer('1.2.8')))
  
    t.notOk(new SemVer('1.2.8').matches(new SemVer('2.0.0')))
    t.notOk(new SemVer('1.2.8').matches(new SemVer('1.3.2')))
    t.notOk(new SemVer('1.2.8').matches(new SemVer('1.2.9')))
  
    t.notOk(new SemVer('1.2.8').matches(new SemVer('0.1.0')))
  })

  t.test('incomplete semver', async t => {
    t.ok(new SemVer('1').matches(new SemVer('1')))
    t.ok(new SemVer('1').matches(new SemVer('1.2')))
    t.ok(new SemVer('1').matches(new SemVer('1.2.9')))
    
    t.ok(new SemVer('1.2').matches(new SemVer('1')))
    t.ok(new SemVer('1.2').matches(new SemVer('1.1')))
    t.ok(new SemVer('1.2').matches(new SemVer('1.2.9')))
    
    t.notOk(new SemVer('1').matches(new SemVer('2')))
    t.notOk(new SemVer('1').matches(new SemVer('0')))
    
    t.notOk(new SemVer('1.2').matches(new SemVer('1.3')))
  })
})
