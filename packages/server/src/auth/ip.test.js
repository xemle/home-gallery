// @ts-nocheck
import t from 'tap'
import { rules2AllowListRules, isAllowListedIp, defaultIpAllowListRules } from './ip.js'

t.test('Allow all', t => {
  const rules = rules2AllowListRules([{type: 'allow', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.1'), true)
  t.end()
})

t.test('Deny all', t => {
  const rules = rules2AllowListRules([{type: 'deny', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.1'), false)
  t.end()
})

t.test('Allow ip', t => {
  const rules = rules2AllowListRules([{type: 'allow', value: '192.168.0.1'}, {type: 'deny', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.1'), true)
  t.equal(isAllowListedIp(rules, '192.168.0.2'), false)
  t.end()
})

t.test('Deny ip', t => {
  const rules = rules2AllowListRules([{type: 'deny', value: '192.168.0.1'}, {type: 'allow', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.1'), false)
  t.equal(isAllowListedIp(rules, '192.168.0.2'), true)
  t.end()
})

t.test('Allow network', t => {
  const rules = rules2AllowListRules([{type: 'allow', value: '192.168.0.1/24'}, {type: 'deny', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.53'), true)
  t.equal(isAllowListedIp(rules, '192.168.1.53'), false)
  t.end()
})

t.test('Deny network', t => {
  const rules = rules2AllowListRules([{type: 'deny', value: '192.168.0.1/24'}, {type: 'allow', value: 'all'}])
  t.equal(isAllowListedIp(rules, '192.168.0.53'), false)
  t.equal(isAllowListedIp(rules, '192.168.1.53'), true)
  t.end()
})

t.test('Allow local network', t => {
  const rules = rules2AllowListRules([{type: 'allow', value: '127/8'}, {type: 'deny', value: 'all'}])
  t.equal(isAllowListedIp(rules, '127.0.0.1'), true)
  t.equal(isAllowListedIp(rules, '::ffff:127.0.0.2'), true)
  t.equal(isAllowListedIp(rules, '128.0.0.1'), false)
  t.end()
})

t.test('Allow default local network', t => {
  const rules = rules2AllowListRules(defaultIpAllowListRules)
  t.equal(isAllowListedIp(rules, '127.0.0.1'), true)
  t.equal(isAllowListedIp(rules, '::ffff:127.0.0.2'), true)
  t.equal(isAllowListedIp(rules, '128.0.0.1'), false)
  t.end()
})
