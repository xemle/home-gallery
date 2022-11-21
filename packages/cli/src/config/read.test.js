const t = require('tap')
const path = require('path')
const YAML = require('yaml')

const { readConfig, readData } = require('./read')
const testDir = path.resolve(__dirname, '..', '..', 'test')

const env = {
  HOME: '/data'
}

const y2o = yaml => YAML.parse(yaml)

t.test('readConfig', async t => {
  t.test('minimal', async t => {
    const expected = {
      sources: [
        { dir: '/data/Pictures' }
      ]
    }
    t.match(await readConfig(path.join(testDir, 'minimal.yml'), env), expected)
  })
})

t.test('readData source', async t => {
  const baseDir = '/app'

  t.test('as string', async t => {
    const data = `
      sources:
        - ~/Pictures
      `
    const expected  = `
      sources:
        - dir: /data/Pictures
          index: /data/.config/home-gallery/Pictures.idx
    `
    t.match(readData(data, true, baseDir, env), y2o(expected))
  })

  t.test('source relative path', async t => {
    const data = `
      sources:
        - ./Pictures
      `
    const expected  = `
      sources:
        - dir: /app/Pictures
    `
    t.match(readData(data, true, baseDir, env), y2o(expected))
  })

  t.test('absolute path', async t => {
    const data = `
      sources:
        - /Pictures
      `
    const expected  = `
      sources:
        - dir: /Pictures
    `
    t.match(readData(data, true, baseDir, env), y2o(expected))
  })

  t.test('as object', async t => {
    const data = `
      sources:
        - dir: ~/Pictures
      `
    const expected  = `
      sources:
        - dir: /data/Pictures
    `
    t.match(readData(data, true, baseDir, env), y2o(expected))
  })

  t.test('with var', async t => {
    const data = `
      sources:
        - dir: ~/Pictures
      `
    const expected  = `
      sources:
        - dir: /data/Pictures
          index: /data/config/Pictures.idx
      `
    t.match(readData(data, true, '/data/config', {...env, GALLERY_CONFIG_DIR: '/data/config'}), y2o(expected))
  })
})

t.test('readData base settings', async t => {
  t.test('for docker', async t => {
    const data = `
      sources:
        - dir: ~/Pictures
      `
    const expected  = `
      sources:
        - dir: /data/Pictures
          index: /data/config/Pictures.idx
      storage:
        dir: /data/storage
      database:
        file: /data/config/database.db
      events:
        file: /data/config/events.db
      `
    t.match(readData(data, true, '/data/config', {...env, GALLERY_CONFIG_DIR: '/data/config', GALLERY_CACHE_DIR: '/data'}), y2o(expected))
  })

  t.test('for docker with prefix', async t => {
    const data = `
      sources:
        - dir: ~/Pictures
      `
    const expected  = `
      sources:
        - dir: /data/Pictures
          index: /data/config/home-Pictures.idx
      storage:
        dir: /data/storage
      database:
        file: /data/config/home-database.db
      events:
        file: /data/config/home-events.db
      `
    t.match(readData(data, true, '/data/config', {...env, GALLERY_CONFIG_DIR: '/data/config', GALLERY_CACHE_DIR: '/data', GALLERY_CONFIG_PREFIX: 'home-'}), y2o(expected))
  })
})

t.test('readData with json', async t => {
  const data = `{"sources": ["~/Pictures"]}`
  const expected  = `
    sources:
      - dir: /data/Pictures
        index: /data/.config/home-gallery/Pictures.idx
  `
  t.match(readData(data, false, '/app', env), y2o(expected))
})

t.test('readData server settings', async t => {
  t.test('expand auth user', async t => {
    const data = `
      server:
        auth:
          users:
            - john: s3cre1
            - username: alice
              password: changeme
      `
    const expected  = `
      server:
        auth:
          users:
            - username: john
              password: s3cre1
            - username: alice
              password: changeme
    `
    t.match(readData(data, true, '/', env), y2o(expected))
  })

  t.test('expand auth rules', async t => {
    const data = `
      server:
        auth:
          rules:
            - allow: localhost
            - deny: 192.168/16
            - type: allow
              value: 10/8
      `
    const expected  = `
      server:
        auth:
          rules:
            - type: allow
              value: localhost
            - type: deny
              value: 192.168/16
            - type: allow
              value: 10/8
    `
    t.match(readData(data, true, '/', env), y2o(expected))
  })
})
