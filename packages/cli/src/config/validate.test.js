const t = require('tap')
const path = require('path')

const { readData } = require('./read')
const { validateConfig } = require('./validate')
const testDir = path.resolve(__dirname, '..', '..', 'test')

t.test('validate', async t => {
  const validateEnv = {
    HOME: testDir,
    GALLERY_BASE_DIR: testDir,
    GALLERY_CONFIG_DIR: path.resolve(testDir, 'config')
  }
  
  t.test('all OK', async t => {
    const data = `
      sources:
        - ~/Pictures
      `
    const config = readData(data, true, testDir, validateEnv)
    t.resolves(validateConfig(config))
  })

  t.test('source directory does not exist', async t => {
    const data = `
      sources:
        - ~/Media
      `
    const config = readData(data, true, testDir, validateEnv)
    t.rejects(validateConfig(config))
  })

  t.test('offline source with index', async t => {
    const data = `
      sources:
        - dir: ~/Media
          offline: true
      `
    const config = readData(data, true, testDir, validateEnv)
    t.resolves(validateConfig(config))
  })

  t.test('offline source without index', async t => {
    const data = `
      sources:
        - dir: ~/Photos
          offline: true
      `
    const config = readData(data, true, testDir, validateEnv)
    t.rejects(validateConfig(config))
  })
})
