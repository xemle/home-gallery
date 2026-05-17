// @ts-nocheck
import t from 'tap';
import { loggerMock, mockRes } from "../utils/test-utils.js";

const loadAuth = t => t.mockImport('./argument-req-by-user-middleware.js', {...loggerMock()})

const users = [{username: 'alice', password: 'secret'}]
const roles = []
const denyAllRules = [{type: 'deny', value: 'all'}]

const fakeSession = {username: 'alice', roles: ['viewer'], readOnly: true}
const mockSessionStore = {
  async getSession(id) {
    return id === 'valid-id' ? fakeSession : null
  }
}

t.test('augmentReqByUserMiddleware', async t => {
  const {augmentReqByUserMiddleware} = await loadAuth(t)

  t.test('sets req.username from Basic auth header', async t => {
    const middleware = augmentReqByUserMiddleware()
    const req = {headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    let called = false
    await middleware(req, {}, () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('skips if no authorization header', async t => {
    const middleware = augmentReqByUserMiddleware()
    const req = {headers: {}}
    let called = false
    await middleware(req, {}, () => { called = true })

    t.equal(req.username, undefined)
    t.ok(called)
    t.end()
  })

  t.test('Reads username from session', async t => {
    const context = {
      auth: {
        sessionStore: {
          async getSession(id) {
            return id === 'valid-id' ? {username: 'alice'} : null
          }
        }
      }
    }
    const middleware = augmentReqByUserMiddleware(context)
    const req = {headers: {}, sessionId: 'valid-id'}
    let called = false
    await middleware(req, {}, () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('Username from invalid session is empty', async t => {
    const context = {
      auth: {
        sessionStore: {
          async getSession(id) {
            return id === 'valid-id' ? {username: 'alice'} : null
          }
        }
      }
    }
    const middleware = augmentReqByUserMiddleware(context)
    const req = {headers: {}, sessionId: 'bad-id'}
    let called = false
    await middleware(req, {}, () => { called = true })

    t.equal(req.username, undefined)
    t.ok(called)
    t.end()
  })

  t.end()
})
