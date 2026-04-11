import t from 'tap'
import {loggerMock, mockRes} from "../utils/test-utils.js";

const loadAuth = t => t.mockImport('./index.js', {...loggerMock()})

const users = [{username: 'alice', password: 'secret'}]
const roles = []
const denyAllRules = [{type: 'deny', value: 'all'}]

const fakeSession = {username: 'alice', roles: ['viewer'], readOnly: true}
const sessionStore = {
  getSession(id) {
    return id === 'valid-id' ? fakeSession : null
  }
}

t.test('createCookieAuthMiddleware', async t => {
  const {createCookieAuthMiddleware} = await loadAuth(t)

  t.test('whitelisted IP sets ignoreAuth and calls next', t => {
    const rules = [{type: 'allow', value: 'all'}]
    const middleware = createCookieAuthMiddleware(users, roles, rules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.ignoreAuth, true)
    t.ok(called)
    t.end()
  })

  t.test('valid session cookie populates req and calls next', t => {
    const middleware = createCookieAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {cookie: 'SESSIONID=valid-id'}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.same(req.roles, ['viewer'])
    t.equal(req.readOnly, true)
    t.ok(called)
    t.end()
  })

  t.test('invalid session cookie without anonymous access returns 401', t => {
    const middleware = createCookieAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {cookie: 'SESSIONID=bad-id'}}
    const res = mockRes()
    middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.test('invalid session cookie with anonymous access falls through if anonymous mode enabled', t => {
    const middleware = createCookieAuthMiddleware(users, roles, denyAllRules, sessionStore, true, true)
    let called = false
    const req = {ip: '1.2.3.4', headers: {cookie: 'SESSIONID=bad-id'}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.readOnly, true)
    t.ok(called)
    t.end()
  })

  t.test('no cookie with anonymous access calls next with readOnly', t => {
    const middleware = createCookieAuthMiddleware(users, roles, denyAllRules, sessionStore, true, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.readOnly, false)
    t.ok(called)
    t.end()
  })

  t.test('no cookie without anonymous access returns 401', t => {
    const middleware = createCookieAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    const res = mockRes()
    middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.end()
})

t.test('augmentReqByUserMiddleware', async t => {
  const {augmentReqByUserMiddleware} = await loadAuth(t)
  const middleware = augmentReqByUserMiddleware()

  t.test('sets req.username from Basic auth header', t => {
    const req = {headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    let called = false
    middleware(req, {}, () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('skips if no authorization header', t => {
    const req = {headers: {}}
    let called = false
    middleware(req, {}, () => { called = true })

    t.equal(req.username, undefined)
    t.ok(called)
    t.end()
  })

  t.end()
})
