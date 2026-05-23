// @ts-nocheck
import t from 'tap'
import {getLogMessages, loggerMock, mockRes, mockRouter} from "../../utils/test-utils.js";
import { get } from 'node:http';
import { createAuthContext } from '../../auth/auth-context.js';
import { userInfo } from 'node:os';

const loadAuthApi = t => t.mockImport('./index.js', {...loggerMock()})

const config = {
  server: {
    auth: {
      users: [
        '$anonymous',
        {username: 'alice', password: 'secret', roles: ['admin']}
      ],
      roles: [
        {name: 'admin', filter: 'tag:private'}
      ],
      rules: [
        {type: 'allow', value: 'localhost'},
        {type: 'deny', value: 'all'}
      ]
    }
  }
}

t.test('POST /api/auth/login', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('missing username or password returns 401', async t => {
    const router = mockRouter()
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice'}}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /invalid/i})
    t.end()
  })

  t.test('wrong password returns 401', async t => {
    const router = mockRouter()
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice', password: 'wrong'}}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /invalid/i})
    t.end()
  })

  t.test('unknown user returns 401', async t => {
    const router = mockRouter()
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'unknown', password: 'x'}}, res)

    t.equal(res._status, 401)
    t.end()
  })

  t.test('valid credentials creates session, sets cookie, returns user info', async t => {
    const router = mockRouter()
    const sessions = {}
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async createSession(username) {
        const sessionId = 'new-session-id'
        sessions[sessionId] = {username}
        return sessionId
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/login', ip: '127.0.0.1', body: {username: 'alice', password: 'secret'}}, res)

    t.equal(res._status, 200)
    t.equal(res._body.data?.username, 'alice')
    t.ok(res._setCookies.find(v => v.includes('new-session-id')))
    t.ok(sessions['new-session-id'])
    t.equal(sessions['new-session-id'].username, 'alice')
    t.end()
  })

  t.end()
})

t.test('POST /api/auth/logout', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('deletes session, clears cookie returns $allow user', async t => {
    const router = mockRouter()
    const sessions = {
      'sid-1': {username: 'alice'}
    }
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      },
      async deleteSession(id) {
        delete sessions[id]
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/logout', ip: '127.0.0.1', headers: {}, sessionId: 'sid-1'}, res)

    t.equal(res._status, 200)
    t.same(res._body, {
      ok: true,
      data: {
        username: '$allow',
        roles: [],
        webapp: {}
      }
    })
    t.notOk(sessions['sid-1'])
    t.ok(res._setCookies.find(v => v.includes('Max-Age=0')))
    t.end()
  })

  t.test('deletes session, clears cookie returns $anonymous user', async t => {
    const router = mockRouter()
    const sessions = {
      'sid-1': {username: 'alice'}
    }
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      },
      async deleteSession(id) {
        delete sessions[id]
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/logout', ip: '1.1.1.1', headers: {}, sessionId: 'sid-1'}, res)

    t.equal(res._status, 200)
    t.same(res._body, {
      ok: true,
      data: {
        username: '$anonymous',
        roles: [],
        webapp: {}
      }
    })
    t.notOk(sessions['sid-1'])
    t.ok(res._setCookies.find(v => v.includes('Max-Age=0')))
    t.end()
  })

  t.test('no cookie is a graceful no-op', async t => {
    const router = mockRouter()
    const sessions = {}
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      },
      async deleteSession(id) {
        delete sessions[id]
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({method: 'POST', path: '/api/auth/logout', ip: '127.0.0.1', headers: {}}, res)

    t.equal(res._status, 200)
    t.same(res._body, {
      ok: true,
      data: {
        username: '$allow',
        roles: [],
        webapp: {}
      }
    })
    t.end()
  })

  t.end()
})

t.test('GET /api/auth/me', async t => {
  const {authApi} = await loadAuthApi(t)

  t.test('no cookie returns 401', async t => {
    const router = mockRouter()
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    await authApi(context)

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}}, res)

    t.equal(res._status, 401)
  })

  t.test('invalid session returns 401 and clears cookie', async t => {
    const router = mockRouter()
    const sessions = {
      'good-session': {username: 'alice'}
    }
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}, sessionId: 'bad'}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /Invalid session/i})
    t.ok(res._setCookies.find(v => v.includes('Max-Age=0')))
  })

  t.test('valid session returns 401 for unknown user', async t => {
    const router = mockRouter()
    const sessions = {
      'good-session': {username: 'unknown'}
    }
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}, sessionId: 'good-session'}, res)

    t.equal(res._status, 401)
    t.match(res._body, {error: /Invalid session/i})
  })

  t.test('valid session returns user data', async t => {
    const router = mockRouter()
    const sessions = {
      'good-session': {username: 'alice'}
    }
    const context = {
      config,
      router
    }
    context.auth = await createAuthContext(context.config)
    context.auth.sessionStore = {
      async getSession(id) {
        return sessions[id] || null
      }
    }
    await authApi(context)

    const res = mockRes()
    await router.invoke({path: '/api/auth/me', headers: {}, sessionId: 'good-session'}, res)

    t.equal(res._status, 200)
    t.same(res._body, {
      data: {
        username: 'alice',
        roles: ['admin'],
        webapp: {}
      }
    })
  })

  t.end()
})
