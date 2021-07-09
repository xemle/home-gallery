const path = require('path')
const { rm } = require('shelljs')
const { generateId } = require('../utils')

const testBaseDir = process.env.gallery_tmp_dir
const randomId = !!`${process.env.gallery_tmp_dir_radomize || 'true'}`.toLowerCase().match(/(true|1)/)
const keepTempDir = !!`${process.env.gallery_tmp_dir_keep || 'true'}`.toLowerCase().match(/(true|1)/)

beforeSuite(async () => {
  const runId = `${randomId ? generateId(6) : 'static'}`
  gauge.dataStore.suiteStore.put('runId', runId)
  gauge.message(`Unique run ID is ${runId}`)
})

const sanitizeName = name => name.replace(/[^_0-9A-Za-z]/g, '-').replace(/[-]+/g, '-').toLocaleLowerCase()

const createBaseDir = context => {
  const runId = gauge.dataStore.suiteStore.get('runId')
  const spec = context.currentSpec.name
  const scenario = context.currentScenario.name
  return path.join(testBaseDir, 'run-e2e', runId, sanitizeName(spec), sanitizeName(scenario))
}

beforeScenario(async (context) => {
  const baseDir = createBaseDir(context)
  gauge.dataStore.scenarioStore.put('baseDir', baseDir)
})

afterSuite(async (context) => {
  if (keepTempDir) {
    return
  }
  const tmpDir = path.join(testBaseDir, 'run-e2e')
  rm('-rf', tmpDir)
  gauge.message(`Remove tmpDir ${tmpDir}`)
})
