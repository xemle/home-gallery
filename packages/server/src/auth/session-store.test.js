import t from 'tap'

const addSeconds = (base, sec) => new Date(base.getTime() + sec * 1000)

const NOW = new Date("2020-10-20T07:00:00Z")
const PAST = addSeconds(NOW, -60)
const FUTURE = addSeconds(NOW, 60)

t.test('createSession creates and writes a new session', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    randomHex: 'abc123',
  })

  const store = createSessionStore('/tmp/sessions.json')
  const id = store.createSession('alice', ['admin'], true)

  t.equal(id, 'abc123')
  t.equal(writes.length, 1)

  const write = writes[0]
  t.equal(write.file, '/tmp/sessions.json')
  t.equal(write.enc, 'utf8')

  const saved = JSON.parse(write.data)
  t.ok(saved.abc123)
  t.equal(saved.abc123.username, 'alice')
  t.same(saved.abc123.roles, ['admin'])
  t.equal(saved.abc123.readOnly, true)
  t.equal(saved.abc123.pages, undefined)

  const created = Date.parse(saved.abc123.created)
  const expires = Date.parse(saved.abc123.expires)
  t.equal(expires - created, 604800000) // 7 days in ms
})

t.test('createSession stores pages when provided', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    randomHex: 'abc456',
  })

  const store = createSessionStore('/tmp/sessions.json')
  const pages = {disabled: ['map', 'tag']}
  store.createSession('bob', [], false, pages)

  const saved = JSON.parse(writes[0].data)
  t.same(saved.abc456.pages, pages)
})

t.test('getSession returns an existing valid session', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    readData: {
      s1: {
        username: 'bob',
        roles: ['user'],
        readOnly: false,
        created: NOW.toISOString(),
        expires: FUTURE.toISOString(),
      },
    },
  })

  const store = createSessionStore('/tmp/sessions.json')
  const session = store.getSession('s1')

  t.ok(session)
  t.equal(session.username, 'bob')
  t.same(session.roles, ['user'])
  t.equal(session.readOnly, false)
  t.equal(session.expires, FUTURE.toISOString())
  t.equal(writes.length, 0)
})

t.test('getSession returns null for unknown session id', async t => {
  const {createSessionStore} = await loadSessionStore(t, {
    readData: {},
  })

  const store = createSessionStore('/tmp/sessions.json')

  t.equal(store.getSession('missing'), null)
})

t.test('expired sessions are pruned on startup', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    readData: {
      expired1: {
        username: 'old',
        roles: [],
        readOnly: false,
        created: NOW.toISOString(),
        expires: PAST.toISOString(),
      },
      valid1: {
        username: 'new',
        roles: ['user'],
        readOnly: false,
        created: NOW.toISOString(),
        expires: FUTURE.toISOString(),
      },
    },
  })

  const store = createSessionStore('/tmp/sessions.json')

  t.equal(writes.length, 1)
  const saved = JSON.parse(writes[0].data)
  t.ok(saved['valid1'])

  t.equal(store.getSession('expired1'), null)
  t.ok(store.getSession('valid1'))
})

t.test('getSession deletes a session that expires after startup', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    readData: {
      s1: {
        username: 'carol',
        roles: [],
        readOnly: false,
        created: NOW.toISOString(),
        expires: addSeconds(NOW, 1).toISOString(),
      },
    },
  })

  const store = createSessionStore('/tmp/sessions.json')

  t.ok(store.getSession('s1'))

  Date.now = () => addSeconds(NOW, 5).getTime()

  t.equal(store.getSession('s1'), null)
  t.equal(writes[0].data, '{}')
})

t.test('deleteSession removes a session and writes empty', async t => {
  const {createSessionStore, writes} = await loadSessionStore(t, {
    readData: {
      s1: {
        username: 'dave',
        roles: ['user'],
        readOnly: false,
        created: NOW.toISOString(),
        expires: FUTURE.toISOString(),
      },
    },
  })

  const store = createSessionStore('/tmp/sessions.json')
  store.deleteSession('s1')

  t.equal(writes[0].data, '{}')
})

t.test('store starts empty when session JSON read fails', async t => {
  const err = new Error('permission denied')

  const {createSessionStore, writes} = await loadSessionStore(t, {
    readError: err,
    randomHex: 'from-empty-store',
  })

  const store = createSessionStore('/tmp/sessions.json')
  const id = store.createSession('eve', [], false)

  t.equal(id, 'from-empty-store')
  t.equal(writes.length, 1)

  const saved = JSON.parse(writes[0].data)
  t.ok(saved['from-empty-store'])
})

async function loadSessionStore(
  t,
  {
    readData,
    readError,
    writeImpl,
    randomHex = 'session-id-123',
  } = {}
) {
  freezeDateNow(t);
  const writes = []

  const fakeFs = {
    readFileSync(file, enc) {
      if (readError) {
        throw readError
      }
      return JSON.stringify(readData)
    },

    writeFileSync(file, data, enc) {
      writes.push({file, data, enc})
      if (writeImpl) {
        return writeImpl(file, data, enc)
      }
    },
  }

  const fakeCrypto = {
    randomBytes(size) {
      return {
        toString(enc) {
          return randomHex
        },
      }
    },
  }

  const mod = await t.mockImport('./session-store.js', {
    fs: {default: fakeFs},
    crypto: {default: fakeCrypto},
    '@home-gallery/logger': {
      default: () => ({
        warn() {
        },
        error() {
        },
        debug() {
        },
      }),
    },
  })

  return {
    createSessionStore: mod.createSessionStore,
    writes,
  }
}

function freezeDateNow(t) {
  const dateNow = Date.now
  Date.now = () => NOW.getTime()
  t.teardown(() => {
    Date.now = dateNow
  })
}
