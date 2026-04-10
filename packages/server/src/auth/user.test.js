import t from 'tap'
import {matchesUser, resolveUsers, users2UserMap} from './user.js'

t.test('plain password', t => {
  const userMap = users2UserMap([{username: 'admin', password: 'admin'}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('plain formatted password', t => {
  const userMap = users2UserMap([{username: 'admin', password: '{PLAIN}admin'}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('sha1 formatted password', t => {
  const userMap = users2UserMap([{username: 'admin', password: '{SHA}0DPiKuNIrrVmD8IUCuw1hQxNqZc='}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('sha256salted formatted password', t => {
  const userMap = users2UserMap([{username: 'admin', password: '{SHA256-salted}lxBgzWvrFbDD+pcA.wyBh/87lu8SXrZ7Af0oovObiZeJk14AoBTxDW7HT5pY='}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('list', t => {
  const userMap = users2UserMap([{username: 'admin', password: 'admin'}, {username: 'demo', password: 'demo'}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.equal(matchesUser(userMap, 'demo', 'demo'), true)
  t.equal(matchesUser(userMap, 'demo', 'admin'), false)
  t.end()
})

t.test('user without roles has no filter and is not readOnly', t => {
  const users = [{username: 'alice', password: 'secret'}]
  const resolved = resolveUsers(users, [])[0]
  t.equal(resolved.username, 'alice')
  t.equal(resolved.filter, undefined)
  t.equal(resolved.readOnly, false)
  t.equal(resolved.roles.length, 0)
  t.ok(resolved.testPassword('secret'))
  t.notOk(resolved.testPassword('wrong'))
  t.end()
})

t.test('user filter combines with role filter', t => {
  const users = [{username: 'alice', password: 'secret', filter: 'tag:photos', roles: ['viewer']}]
  const roles = [{name: 'viewer', filter: 'tag:videos'}]
  const resolved = resolveUsers(users, roles)
  t.equal(resolved[0].filter, '(tag:videos) or (tag:photos)')
  t.end()
})

t.test('user explicit readOnly overrides role readOnly', t => {
  const users = [{username: 'alice', password: 'secret', readOnly: false, roles: ['viewer']}]
  const roles = [{name: 'viewer', readOnly: true}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.readOnly, false)
  t.end()
})

t.test('empty user filter inherits from role', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['viewer']}]
  const roles = [{name: 'viewer', filter: 'tag:photos'}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.filter, '(tag:photos)')
  t.end()
})

t.test('user filter preserved if no roles', t => {
  const users = [{username: 'alice', password: 'secret', filter: 'tag:photos'}]
  const resolved = resolveUsers(users, [])[0]
  t.equal(resolved.filter, '(tag:photos)')
  t.end()
})

t.test('user filter is union of multiple role filters', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', filter: 'tag:a'}, {name: 'r2', filter: 'tag:b'}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.filter, '(tag:a) or (tag:b)')
  t.end()
})

t.test('user filter is unrestricted if any role has no filter', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', filter: 'tag:a'}, {name: 'r2'}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.filter, undefined)
  t.end()
})

t.test('user has readOnly true when all roles are readOnly', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', readOnly: true}, {name: 'r2', readOnly: true}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.readOnly, true)
  t.end()
})

t.test('user has readOnly false when any role is not readOnly', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', readOnly: true}, {name: 'r2', readOnly: false}]
  const resolved = resolveUsers(users, roles)[0]
  t.equal(resolved.readOnly, false)
  t.end()
})

