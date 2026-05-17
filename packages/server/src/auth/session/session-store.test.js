// @ts-nocheck
import t from 'tap'

const addSeconds = (base, sec) => new Date(base.getTime() + sec * 1000)
const addHours = (base, hours) => addSeconds(base, hours * 3600)

const NOW = new Date("2020-10-20T07:00:00Z")
const PAST = addSeconds(NOW, -60)
const FUTURE = addSeconds(NOW, 60)

t.test('createSession creates and writes a new session', async t => {
  const {createSessionStore} = await loadSessionStore(t, {
    randomUuid: 'abc123',
  })

  const store = createMemoryStore()
  const sessionStore = await createSessionStore(store)
  const id = await sessionStore.createSession('alice')

  t.equal(id, 'abc123')

  const saved = store.sessions
  t.ok(saved.abc123)
  t.equal(saved.abc123.username, 'alice')

  const created = Date.parse(saved.abc123.created)
  const updated = Date.parse(saved.abc123.updated)
  const expires = Date.parse(saved.abc123.expires)
  t.equal(created, updated)
  t.equal(expires - created, 604800000) // 7 days in ms
})

t.test('createSession stores pages when provided', async t => {
  const {createSessionStore} = await loadSessionStore(t, {
    randomUuid: 'abc456',
  })

  const store = createMemoryStore()
  const sessionStore = await createSessionStore(store)
  await sessionStore.createSession('bob')

  const saved = store.sessions['abc456']
})

t.test('getSession returns an existing valid session', async t => {
  const {createSessionStore} = await loadSessionStore(t)

  const store = createMemoryStore({
    s1: {
      username: 'bob',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: FUTURE.toISOString(),
    },
  })
  const sessionStore = await createSessionStore(store)
  const session = await sessionStore.getSession('s1')

  t.ok(session)
  t.equal(session.username, 'bob')
  t.equal(session.expires, FUTURE.toISOString())
  t.equal(store.writeCount, 0)
})

t.test('getSession updates existing valid session', async t => {
  const {createSessionStore} = await loadSessionStore(t)

  const store = createMemoryStore({
    s1: {
      username: 'bob',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: FUTURE.toISOString(),
    },
  })
  const sessionStore = await createSessionStore(store, 60 * 1000, 10 * 1000) // 1 min TTL, 10 sec update

  Date.now = () => addSeconds(NOW, 25).getTime()
  const session = await sessionStore.getSession('s1')

  t.ok(session)
  t.equal(session.username, 'bob')
  t.equal(session.updated, addSeconds(NOW, 25).toISOString())
  t.equal(session.expires, addSeconds(NOW, 25 + 60).toISOString())
  t.equal(store.writeCount, 1)
})

t.test('getSession returns null for unknown session id', async t => {
  const {createSessionStore} = await loadSessionStore(t)

  const store = createMemoryStore()
  const sessionStore = await createSessionStore(store)

  t.equal(await sessionStore.getSession('missing'), null)
})

t.test('expired sessions are pruned on startup', async t => {
  const {createSessionStore} = await loadSessionStore(t)

  const store = createMemoryStore({
    expired1: {
      username: 'old',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: PAST.toISOString(),
    },
    valid1: {
      username: 'new',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: FUTURE.toISOString(),
    },
  })
  const sessionStore = await createSessionStore(store)

  t.equal(store.writeCount, 1)
  const saved = store.sessions
  t.ok(saved['valid1'])

  t.equal(await sessionStore.getSession('expired1'), null)
  t.ok(await sessionStore.getSession('valid1'))
})

t.test('getSession deletes a session that expires after startup', async t => {
  const {createSessionStore} = await loadSessionStore(t)
  const store = createMemoryStore({
    s1: {
      username: 'carol',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: addSeconds(NOW, 1).toISOString(),
    },
  })
  const sessionStore = await createSessionStore(store)

  t.ok(await sessionStore.getSession('s1'))

  Date.now = () => addSeconds(NOW, 5).getTime()

  t.equal(await sessionStore.getSession('s1'), null)
  t.equal(Object.entries(store.sessions).length, 0)
})

t.test('deleteSession removes a session and writes empty', async t => {
  const {createSessionStore} = await loadSessionStore(t)

  const store = createMemoryStore({
    s1: {
      username: 'dave',
      created: NOW.toISOString(),
      updated: NOW.toISOString(),
      expires: FUTURE.toISOString(),
    },
  })
  const sessionStore = await createSessionStore(store)
  await sessionStore.deleteSession('s1')

  t.equal(Object.entries(store.sessions).length, 0)
})

async function loadSessionStore(
  t,
  {
    randomUuid = 'session-id-123',
  } = {}
) {
  freezeDateNow(t);

  const fakeCrypto = {
    randomUUID(options) {
      return randomUuid
    }
  }

  const mod = await t.mockImport('./session-store.js', {
    crypto: {default: fakeCrypto},
    '@home-gallery/logger': {
      default: () => ({
        error() {
        },
        warn() {
        },
        info() {
        },
        debug() {
        },
      }),
    },
  })

  return {
    createSessionStore: mod.createSessionStore,
  }
}

function freezeDateNow(t) {
  const dateNow = Date.now
  Date.now = () => NOW.getTime()
  t.teardown(() => {
    Date.now = dateNow
  })
}

function createMemoryStore(sessions = {}) {
  return {
    sessions: sessions,
    async read() {
      return this.sessions
    },
    writeCount: 0,
    async write(newSessions) {
      this.sessions = newSessions
      this.writeCount++
    },
  }
}