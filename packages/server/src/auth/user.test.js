import t from 'tap'
import { users2UserMap, matchesUser } from './user.js'

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

