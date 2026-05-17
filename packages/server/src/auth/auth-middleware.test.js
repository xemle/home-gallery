// @ts-nocheck
import t from 'tap';
import { loggerMock, mockRes } from "../utils/test-utils.js";
import { createAuthContext } from './auth-context.js'

const loadAuth = t => t.mockImport('./auth-middleware.js', {...loggerMock()})

const users = [{username: 'alice', password: 'secret'}]
const roles = []
const denyAllRules = [{type: 'deny', value: 'all'}]

const fakeSession = {username: 'alice', roles: ['viewer'], readOnly: true}
const mockSessionStore = {
  async getSession(id) {
    return id === 'valid-id' ? fakeSession : null
  }
}

t.test('authMiddleware', async t => {
  const {authMiddleware} = await loadAuth(t)

  t.test('whitelisted IP sets ignoreAuth and calls next', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'allow', value: 'all'}]
          }
        }
      },
      auth: {
        users: {
          '$allow': {username: '$allow'}
        },
      }
    }
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    await middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, '$allow')
    t.ok(called)
    t.end()
  })

  t.test('valid basic auth credentials call next', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}],
            users: [{username: 'alice', password: 'secret'}]
          }
        }
      },
    }
    context.auth = await createAuthContext(context.config)
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    await middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('invalid basic auth credentials fall through to 401 when no session', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}],
            users: [{username: 'alice', password: 'secret'}]
          }
        }
      },
    }
    context.auth = await createAuthContext(context.config)
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:wrong').toString('base64')}}
    const res = mockRes()
    await middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.notOk(called)
    t.end()
  })

  t.test('valid session cookie populates req and calls next', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}],
          }
        }
      },
      auth: {
        allowAnonymous: true,
        users: {
          alice: {username: 'alice', roles: ['viewer'], filter: 'tag:photos', testPassword: () => true}
        },
        sessionStore: {
          async getSession(id) {
            return id === 'valid-id' ? {username: 'alice'} : null
          }
        }
      }
    }
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}, sessionId: 'valid-id'}
    await middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.same(req.user.roles, ['viewer'])
    t.same(req.user.filter, 'tag:photos')
    t.ok(called)
    t.end()
  })

  t.test('invalid session cookie without anonymous access returns 401', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}]
          }
        }
      },
      auth: {
        allowAnonymous: false,
        users: {
        },
        sessionStore: {
          async getSession(id) {
            return id === 'valid-id' ? {username: 'alice'} : null
          }
        }
      }
    }
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}, sessionId: 'bad-id'}
    const res = mockRes()
    await middleware(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.test('no auth with anonymous access calls next with public filter', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}]
          }
        }
      },
      auth: {
        allowAnonymous: true,
        users: {
          '$anonymous': {username: '$anonymous', roles: ['public'], filter: 'tag:public', testPassword: () => false}
        },
      }
    }
    const middleware = authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    await middleware(req, mockRes(), () => { called = true })

    t.equal(req.username, '$anonymous')
    t.same(req.user.roles, ['public'])
    t.same(req.user.filter, 'tag:public')
    t.ok(called)
    t.end()
  })

  t.test('no auth without anonymous access returns 401', async t => {
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}]
          }
        }
      },
      auth: {
        users: {
        }
      }
    }
    const middleware = authMiddleware(context)
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
