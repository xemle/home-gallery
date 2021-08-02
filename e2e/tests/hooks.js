const fs = require('fs/promises')
const path = require('path')
const { rm } = require('shelljs')
const { generateId, dateFormat } = require('../utils')

const testBaseDir = process.env.gallery_tmp_dir
const randomId = !!`${process.env.gallery_tmp_dir_radomize || 'true'}`.toLowerCase().match(/(true|1)/)
const keepTempDir = !!`${process.env.gallery_tmp_dir_keep || 'true'}`.toLowerCase().match(/(true|1)/)
const runDirName = 'gallery-e2e'

beforeSuite(async () => {
  const runId = `${randomId ? `${dateFormat(new Date(), '%Y%M%D-%H%m')}-${generateId(6)}` : 'static'}`
  gauge.dataStore.suiteStore.put('runId', runId)
  gauge.message(`Unique run ID is ${runId}`)

  const currentRunDir = path.join(testBaseDir, runDirName, runId)
  await fs.mkdir(currentRunDir, { recursive: true } )

  const latest = path.join(testBaseDir, runDirName, 'latest')
  await fs.access(latest)
    .then(() => fs.unlink(latest))
    .finally(() => fs.symlink(currentRunDir, latest))
    .catch(e => gauge.message(`Could not set latest link to current run dir ${currentRunDir}: ${e}`))
})

const sanitizeName = name => name.replace(/[^_0-9A-Za-z]/g, '-').replace(/[-]+/g, '-').toLocaleLowerCase()

const createBaseDir = context => {
  const runId = gauge.dataStore.suiteStore.get('runId')
  const spec = context.currentSpec.name
  const scenario = context.currentScenario.name
  const baseDir = path.join(testBaseDir, runDirName, runId, sanitizeName(spec), sanitizeName(scenario))
  gauge.message(`Set test base dir to ${baseDir}`)
  return baseDir
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
