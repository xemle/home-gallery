import t from 'tap'
import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

import { initConfig } from './init.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const readYaml = async file => fs.readFile(file, 'utf-8').then(data => YAML.parse(data))
const y2o = yaml => YAML.parse(yaml)

t.test('init', async t => {
  const sourceConfigFile = path.resolve(__dirname, '..', '..', '..', '..', 'gallery.config-example.yml')
  const testConfig = path.resolve(os.tmpdir(), 'test-config.yml')

  t.afterEach(async () => {
    return fs.access(testConfig).then(() => fs.unlink(testConfig))
  })

  t.test('Set one source', async t => {
    await initConfig(testConfig, sourceConfigFile, ['~/Pictures'])
    const config = await readYaml(testConfig)
    const expected  = `
      sources:
        - dir: ~/Pictures
    `
    t.match(config, y2o(expected))
  })

  t.test('Set multiple sources', async t => {
    await initConfig(testConfig, sourceConfigFile, ['~/Pictures', '/mnt/media', '/home/me/Photos'])
    const config = await readYaml(testConfig)
    const expected  = `
      sources:
        - dir: ~/Pictures
        - dir: /mnt/media
        - dir: /home/me/Photos
    `
    t.match(config, y2o(expected))
  })

})
