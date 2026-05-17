// @ts-nocheck
import t from 'tap'
import {matchesUser, createUserMap} from './user.js'

t.test('plain password', t => {
  const userMap = createUserMap([{username: 'admin', password: 'admin'}], [])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('plain formatted password', t => {
  const userMap = createUserMap([{username: 'admin', password: '{PLAIN}admin'}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('sha1 formatted password', t => {
  const userMap = createUserMap([{username: 'admin', password: '{SHA}0DPiKuNIrrVmD8IUCuw1hQxNqZc='}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('sha256salted formatted password', t => {
  const userMap = createUserMap([{username: 'admin', password: '{SHA256-salted}lxBgzWvrFbDD+pcA.wyBh/87lu8SXrZ7Af0oovObiZeJk14AoBTxDW7HT5pY='}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.end()
})

t.test('list', t => {
  const userMap = createUserMap([{username: 'admin', password: 'admin'}, {username: 'demo', password: 'demo'}])
  t.equal(matchesUser(userMap, 'admin', 'admin'), true)
  t.equal(matchesUser(userMap, 'admin', 'admin2'), false)
  t.equal(matchesUser(userMap, 'demo', 'demo'), true)
  t.equal(matchesUser(userMap, 'demo', 'admin'), false)
  t.end()
})

t.test('user without roles has no filter and role', t => {
  const users = [{username: 'alice', password: 'secret'}]
  const userMap = createUserMap(users, [])

  const user = userMap['alice']
  t.equal(user.username, 'alice')
  t.equal(user.filter, '')
  t.equal(user.roles.length, 0)

  t.ok(user.testPassword('secret'))
  t.notOk(user.testPassword('wrong'))

  t.end()
})

t.test('user filter combines with role filter', t => {
  const users = [{username: 'alice', password: 'secret', filter: 'tag:photos', roles: ['viewer']}]
  const roles = [{name: 'viewer', filter: 'tag:videos'}]


  const userMap = createUserMap(users, roles)


  t.equal(userMap['alice'].filter, '(tag:photos) and (tag:videos)')
  t.end()
})

t.test('empty user filter inherits from role', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['viewer']}]
  const roles = [{name: 'viewer', filter: 'tag:photos'}]


  const userMap = createUserMap(users, roles)


  t.equal(userMap['alice'].filter, 'tag:photos')
  t.end()
})

t.test('user filter preserved if no roles', t => {
  const users = [{username: 'alice', password: 'secret', filter: 'tag:photos'}]


  const userMap = createUserMap(users, [])


  t.equal(userMap['alice'].filter, 'tag:photos')
  t.end()
})

t.test('user filter is union of users filter and multiple role filters', t => {
  const users = [{username: 'alice', password: 'secret', filter: 'tag:photos', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', filter: 'tag:a'}, {name: 'r2', filter: 'tag:b'}]


  const userMap = createUserMap(users, roles)


  t.equal(userMap['alice'].filter, '(tag:photos) and ((tag:a) or (tag:b))')
  t.end()
})

t.test('user filter is set if some role has a filter', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2']}]
  const roles = [{name: 'r1', filter: 'tag:a'}, {name: 'r2'}]


  const userMap = createUserMap(users, roles)


  t.equal(userMap['alice'].filter, 'tag:a')
  t.end()
})

t.test('user inherits disabled from role', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['viewer']}]
  const roles = [{name: 'viewer', webapp: {disabled: ['map', 'tag']}}]


  const userMap = createUserMap(users, roles)


  t.same(userMap['alice'].webapp, {disabled: ['map', 'tag']})
  t.end()
})

t.test('user pages disabled are union of all role pages', t => {
  const users = [{username: 'alice', password: 'secret', roles: ['r1', 'r2', 'r3']}]
  const roles = [{name: 'r1', webapp: {pages: {disabled: ['map']}}}, {name: 'r2'}, {name: 'r3', webapp: {pages: {disabled: ['video', 'year']}}}]


  const userMap = createUserMap(users, roles)


  t.same(userMap['alice'].webapp, {pages: {disabled: ['map', 'video', 'year']}})
  t.end()
})

t.test('user from role tree is resolved', t => {
  const users = [{username: 'alice', filter: 'tag:public', roles: ['r1']}]
  const roles = [
    {name: 'r1', filter: 'year = 2019', webapp: { disabled: ['events'] }, roles: ['r2']},
    {name: 'r2', filter: 'year = 2022', roles: ['r3']},
    {name: 'r3', filter: 'year = 2024', webapp: { disabled: ['pwa'] }, roles: ['r2']},
    {name: 'r4', filter: 'year = 2026', roles: ['r2']},
  ]


  const userMap = createUserMap(users, roles)


  t.same(userMap['alice'].filter, '(tag:public) and ((year = 2019) or (year = 2022) or (year = 2024))')
  t.same(userMap['alice'].webapp, { disabled: ['events', 'pwa'] })
  t.end()
})

t.test('$allow user has deprecated public filter', t => {
  const users = []
  const roles = []
  const publicFilter = 'tag:photos'


  const userMap = createUserMap(users, roles, publicFilter)


  t.same(userMap['$allow'].filter, 'tag:photos')
  t.end()
})

t.test('$allow user has dedicated filter', t => {
  const users = [{username: '$allow', filter: 'tag:videos'}]
  const roles = []
  const publicFilter = 'tag:photos'


  const userMap = createUserMap(users, roles, publicFilter)


  t.same(userMap['$allow'].filter, 'tag:videos')
  t.end()
})
