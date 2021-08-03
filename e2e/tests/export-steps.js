const fs = require('fs/promises')
const path = require('path')
const assert = require("assert")

const { getStorageDir, getDatabaseFilename, getEventsFilename, getExportOutputDir, runCli } = require('../utils')

const runExport = async query => runCli(['export', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '-o', getExportOutputDir(), '-q', query || '']);
step("Create export", async () => runExport(''))

step("Create export for query <query>", async (query) => runExport(query))

step("Export file <file> exists", async (filename) => {
  const exists = await fs.access(path.join(getExportOutputDir(), filename)).then(() => true).catch(() => false)
  assert(exists, `Export file ${filename} is missing`)
})

step("Export file <file> does not exist", async (filename) => {
  const exists = await fs.access(path.join(getExportOutputDir(), filename)).then(() => true).catch(() => false)
  assert(!exists, `Export contains file ${filename}`)
})
