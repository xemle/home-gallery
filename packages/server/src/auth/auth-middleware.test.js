// @ts-nocheck
import t from 'tap';
import { loggerMock, mockRes, mockRouter } from "../utils/test-utils.js";
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

  t.test('allow listed IP sets $allow user and calls next', async t => {
    const router = mockRouter()
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
      },
      router
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, '$allow')
    t.ok(called)
    t.end()
  })

  t.test('allow listed IP sets $allow user over anonymous and calls next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [
              {type: 'allow', value: 'localhost'},
              {type: 'deny', value: 'all'},
            ]
          }
        }
      },
      auth: {
        allowAnonymous: true,
        users: {
          '$allow': {username: '$allow'},
          '$anonymous': {username: '$anonymous'}
        },
      },
      router
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '127.0.0.1', headers: {}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, '$allow')
    t.ok(called)
    t.end()
  })

  t.test('deny listed IP sets $anonymous user and calls next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [
              {type: 'allow', value: 'localhost'},
              {type: 'deny', value: 'all'},
            ]
          }
        }
      },
      auth: {
        allowAnonymous: true,
        users: {
          '$allow': {username: '$allow'},
          '$anonymous': {username: '$anonymous'}
        },
      },
      router
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '192.168.1.1', headers: {}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, '$anonymous')
    t.ok(called)
    t.end()
  })

  t.test('valid basic auth credentials call next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}],
            users: [{username: 'alice', password: 'secret'}]
          }
        }
      },
      router
    }
    context.auth = await createAuthContext(context.config)
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('valid basic auth credentials over valid session call next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'allow', value: 'all'}],
            users: [
              {username: 'alice', password: 'secret'},
              {username: 'bob', password: 'secret'},
            ]
          }
        }
      },
      auth: {
        allowAnonymous: true,
        users: {
          alice: {username: 'alice', roles: ['viewer'], filter: 'tag:photos', testPassword: () => true},
          bob: {username: 'bob', roles: ['viewer'], filter: 'tag:photos', testPassword: () => true},
        },
        sessionStore: {
          async getSession(id) {
            return id === 'valid-id' ? {username: 'bob'} : null
          }
        }
      },
      router
    }
    context.auth = await createAuthContext(context.config)
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}, sessionId: 'valid-id'}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('valid basic auth credentials over allow listed IP call next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'allow', value: 'all'}],
            users: [{username: 'alice', password: 'secret'}]
          }
        }
      },
      router
    }
    context.auth = await createAuthContext(context.config)
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:secret').toString('base64')}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.ok(called)
    t.end()
  })

  t.test('invalid basic auth credentials fall through to 401 when no session', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'deny', value: 'all'}],
            users: [{username: 'alice', password: 'secret'}]
          }
        }
      },
      router,
    }
    context.auth = await createAuthContext(context.config)
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {authorization: 'Basic ' + Buffer.from('alice:wrong').toString('base64')}}
    const res = mockRes()
    await router.invoke(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.notOk(called)
    t.end()
  })

  t.test('valid session cookie populates req and calls next', async t => {
    const router = mockRouter()
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
      },
      router,
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}, sessionId: 'valid-id'}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.same(req.user.roles, ['viewer'])
    t.same(req.user.filter, 'tag:photos')
    t.ok(called)
    t.end()
  })

  t.test('valid session cookie populates req over allow listed ip and calls next', async t => {
    const router = mockRouter()
    const context = {
      config: {
        server: {
          auth: {
            rules: [{type: 'allow', value: 'all'}],
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
      },
      router,
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}, sessionId: 'valid-id'}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, 'alice')
    t.same(req.user.roles, ['viewer'])
    t.same(req.user.filter, 'tag:photos')
    t.ok(called)
    t.end()
  })

  t.test('invalid session cookie without anonymous access returns 401', async t => {
    const router = mockRouter()
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
      },
      router,
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}, sessionId: 'bad-id'}
    const res = mockRes()
    await router.invoke(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.test('no auth with anonymous access calls next with public filter', async t => {
    const router = mockRouter()
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
      },
      router,
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    await router.invoke(req, mockRes(), () => { called = true })

    t.equal(req.username, '$anonymous')
    t.same(req.user.roles, ['public'])
    t.same(req.user.filter, 'tag:public')
    t.ok(called)
    t.end()
  })

  t.test('no auth without anonymous access returns 401', async t => {
    const router = mockRouter()
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
      },
      router,
    }
    await authMiddleware(context)
    let called = false
    const req = {ip: '1.2.3.4', headers: {}}
    const res = mockRes()
    await router.invoke(req, res, () => { called = true })

    t.equal(res._status, 401)
    t.same(res._body, {error: 'Authentication required'})
    t.notOk(called)
    t.end()
  })

  t.end()
})
