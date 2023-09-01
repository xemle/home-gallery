const assert = require("assert")

const { getIndexFilename, getStorageDir, getDatabaseFilename, getEventsFilename, getExportOutputDir, tree, runCli } = require('../utils')

const runExport = async query => runCli(['export', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '-o', getExportOutputDir(), '-q', query || '']);
step("Create export", async () => runExport(''))

step("Create export for query <query>", async (query) => runExport(query))

const fileMatches = async (filename) => {
  const files = await tree(getExportOutputDir())
  const match = filename.match(/^\/(.*)\/([a-g]+)?$/)
  return match ? files.filter(file => file.match(new RegExp(match[1], match[2] || ''))) : files.filter(file => file == filename)
}

step("Export file <file> exists", async (filename) => {
  const matches = await fileMatches(filename)
  assert(matches.length, `Export file ${filename} is missing`)
})

step("Export file <file> does not exist", async (filename) => {
  const matches = await fileMatches(filename)
  assert(matches.length == 0, `Export contains file ${filename}`)
})

const exportMeta = async (args = []) => runCli(['export', 'meta', '-i', getIndexFilename(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), ...args])

step("Export meta", async () => {
  return exportMeta()
})

step("Export meta with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return exportMeta(argList)
})
