// @ts-nocheck
import t from 'tap'
import {getLogMessages, loggerMock, mockRes, mockRouter} from "../../utils/test-utils.js";
import { get } from 'node:http';

const loadAuthApi = t => t.mockImport('./index.js', {...loggerMock()})

const config = {
  server: {
    auth: {
      users: [{username: 'alice', password: 'secret'}],
      roles: []
    }
  }
}

t.test('POST /api/auth/login', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('missing username or password returns 401', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {}
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice'}}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /invalid/i})
    t.end()
  })

  t.test('wrong password returns 401', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {}
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice', password: 'wrong'}}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /invalid/i})
    t.end()
  })

  t.test('unknown user returns 401', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {}
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'unknown', password: 'x'}}, res)

    t.equal(res._status, 401)
    t.end()
  })

  t.test('valid credentials creates session, sets cookie, returns user info', async t => {
    const router = mockRouter()
    let createdSession = null
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {
        async createSession(username, roles) {
          createdSession = {username, roles}
          return 'new-session-id'
        }
      }
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice', password: 'secret'}}, res)

    t.equal(res._status, 200)
    t.equal(res._body.username, 'alice')
    t.ok(res._setCookies.find(v => v.includes('new-session-id')))
    t.ok(createdSession)
    t.equal(createdSession.username, 'alice')
    t.end()
  })

  t.end()
})

t.test('POST /api/auth/logout', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('deletes session and clears cookie', async t => {
    const router = mockRouter()
    const sessions = {
      'sid-1': {username: 'alice'}
    }
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {
        async getSession(id) {
          return sessions[id] || null
        },
        async deleteSession(id) {
          delete sessions[id]
        }
      }
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/logout', ip: '127.0.0.1', headers: {}, sessionId: 'sid-1'}, res)

    t.equal(res._status, 200)
    t.same(res._body, {ok: true})
    t.notOk(sessions['sid-1'])
    t.ok(res._setCookies.find(v => v.includes('Max-Age=0')))
    t.end()
  })

  t.test('no cookie is a graceful no-op', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []}
      },
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/logout', ip: '127.0.0.1', headers: {}}, res)

    t.equal(res._status, 200)
    t.same(res._body, {ok: true})
    t.end()
  })

  t.end()
})

t.test('GET /api/auth/me', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('no cookie returns 401', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []}
      }
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}}, res)

    t.equal(res._status, 401)
  })

  t.test('invalid session returns 401 and clears cookie', async t => {
    const router = mockRouter()
    const sessions = {
      'sid-1': {username: 'alice'}
    }
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: []},
      },
      sessionStore: {
        async getSession(id) {
          return sessions[id] || null
        },
        async deleteSession(id) {
          delete sessions[id]
        }
      }
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}, sessionId: 'bad'}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /expired/i})
    t.ok(res._setCookies.find(v => v.includes('Max-Age=0')))
  })

  t.test('valid session returns user data', async t => {
    const router = mockRouter()
    const auth = {
      users: {
        $anonymous: {username: '$anonymous', testPassword: () => false, roles: []},
        alice: {username: 'alice', testPassword: p => p === 'secret', roles: ['admin']},
      },
      sessionStore: {
        async getSession(id) {
          return id === 'good-session' ? {username: 'alice'} : null
        }
      }
    }
    await authApi({config, router, auth})

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}, sessionId: 'good-session'}, res)

    t.equal(res._status, 200)
    t.equal(res._body.username, 'alice')
    t.same(res._body.roles, ['admin'])
  })

  t.end()
})
