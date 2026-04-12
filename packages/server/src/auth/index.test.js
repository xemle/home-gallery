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

t.test('createAuthMiddleware', async t => {
  const {createAuthMiddleware} = await loadAuth(t)

  t.test('whitelisted IP sets ignoreAuth and calls next', t => {
    const rules = [{type: 'allow', value: 'all'}]
    const middleware = createAuthMiddleware(users, roles, rules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.ignoreAuth, true)
    t.ok(called)
    t.end()
  })

  t.test('valid basic auth credentials call next', t => {
    const middleware = createAuthMiddleware(users, roles, denyAllRules, null, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('invalid basic auth credentials fall through to 401 when no session', t => {
    const middleware = createAuthMiddleware(users, roles, denyAllRules, null, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:wrong').toString('base64')}}
    const res = mockRes()
    middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.notOk(called)
    t.end()
  })

  t.test('valid session cookie populates req and calls next', t => {
    const middleware = createAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
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
    const middleware = createAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
    let called = false
    const req = {ip: '1.2.3.4', headers: {cookie: 'SESSIONID=bad-id'}}
    const res = mockRes()
    middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.test('no auth with anonymous access calls next with readOnly', t => {
    const middleware = createAuthMiddleware(users, roles, denyAllRules, sessionStore, true, true)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    middleware(req, mockRes(), () => { called = true })

    t.equal(req.readOnly, true)
    t.ok(called)
    t.end()
  })

  t.test('anonymous access sets req.pages from anonymousPages', t => {
    const anonymousPages = {disabled: ['map', 'tag']}
    const middleware = createAuthMiddleware(users, roles, denyAllRules, sessionStore, true, false, anonymousPages)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    middleware(req, mockRes(), () => { called = true })

    t.same(req.pages, anonymousPages)
    t.ok(called)
    t.end()
  })

  t.test('no auth without anonymous access returns 401', t => {
    const middleware = createAuthMiddleware(users, roles, denyAllRules, sessionStore, false, false)
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
