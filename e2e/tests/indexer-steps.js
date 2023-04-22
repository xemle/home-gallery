/* globals gauge*/
"use strict";
const { access } = require('fs').promises
const assert = require('assert');
const { getFilesDir, getIndexFilename, getJournalFilename, runCli, readIndex, readJournal } = require('../utils');

step(["Create index", "Update index"], async () => {
  const {code} = await runCli(['index', '-d', getFilesDir(), '-i', getIndexFilename()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step(["Create index with args <args>", "Update index with args <args>"], async (args) => {
  const argList = args.split(/\s+/)
  return runCli(['index', '-d', getFilesDir(), '-i', getIndexFilename(), ...argList]);
})

step("Index has <amount> entries", async (amount) => {
  const index = await readIndex()
  assert(index.data.length == amount, `Expecting ${amount} entries but have ${index.data.length} entries`)
})

const assertEntryChecksum = (entry, checksum, prop) => {
  if (checksum) {
    assert(entry[prop].startsWith(checksum), `Expected filename ${entry.filename} to have checksum ${checksum} but was ${entry[prop]}`)
  } else {
    assert(!entry[prop], `Expected filename ${entry.filename} to have no checksum but was ${entry[prop]}`)
  }
}

const assertChecksum = async (filename, checksum, prop) => {
  const index = await readIndex()
  const entry = index.data.find(entry => entry.filename == filename)
  assert(!!entry, `Could not find a entry with filename ${filename}`)
  assertEntryChecksum(entry, checksum, prop)
}

step("Index has entry <filename> with checksum <checksum>", async (filename, checksum) => assertChecksum(filename, checksum, 'sha1sum'))

step("Index has entry <filename> with prev checksum <checksum>", async (filename, checksum) => assertChecksum(filename, checksum, 'prevSha1sum'))

step("Index has file order <filenames>", async (filenames) => {
  const index = await readIndex()
  const indexFilenames = index.data.map(entry => entry.filename)
  filenames = filenames.split(/\s*,\s*/)
  assert(JSON.stringify(filenames) == JSON.stringify(indexFilenames), `Expected filenames to be [${filenames.join(', ')}], but was [${indexFilenames.join(', ')}]`)
})

step("Journal <id> has entries of <adds> adds, <changes> changes and <removes> removals", async (id, adds, changes, removes) => {
  const journal = await readJournal(id)
  const matchAdds = journal.data.adds.length == adds
  const matchChanges = journal.data.changes.length == changes
  const matchRemoves = journal.data.removes.length == removes
  assert(matchAdds && matchChanges && matchRemoves, `Expecting ${adds} adds, ${changes} changes and ${removes} removes but have ${journal.data.adds.length} adds, ${journal.data.changes.length} changes and ${journal.data.removes.length} removes`)
})

const assertJournalChecksum = async (id, filename, type, checksum, prop) => {
  const journal = await readJournal(id)
  const entry = journal.data[type].find(entry => entry.filename == filename)
  assert(!!entry, `Could not find a journal entry with filename ${filename} in ${type}`)
  assertEntryChecksum(entry, checksum, prop)
}

step("Journal <id> entry <file> in <type> has checksum <checksum>", async (id, filename, type, checksum) => assertJournalChecksum(id, filename, type, checksum, 'sha1sum'))

step("Journal <id> entry <file> in <type> has prev checksum <checksum>", async (id, filename, type, checksum) => assertJournalChecksum(id, filename, type, checksum, 'prevSha1sum'))

step("Delete journal <id>", async id => runCli(['index', 'journal', '-i', getIndexFilename(), '-j', id, '-r']))

const existsJournal = async id => access(getJournalFilename(id)).then(() => true).catch(() => false)

step("Journal <id> exists", async (id) => {
  const exists = await existsJournal(id)
  assert(exists, `Expected journal ${id} exists but it does not`)
})

step("Journal <id> does not exist", async (id) => {
  const exists = await existsJournal(id)
  assert(!exists, `Expected journal ${id} does not exist but it is`)
})
