const path = require('path')

const { matcherFns } = require('./matcher.cjs')
const { prettyPrint } = require('./pretty-print.cjs')

module.exports = {
  getIndexName: filename => path.basename(filename).replace(/\.[^.]+$/, ''),
  getJournalFilename: (indexFilename, journal) => `${indexFilename}.${journal}.journal`,
  removeJournal(indexFilename, journal, cb) {
    import('./index.js').then(({removeJournal}) => {
      removeJournal(indexFilename, journal).then(result => cb(null, result), cb)
    }, cb)
  },
  readIndexHead(indexFilename, cb) {
    import('./index.js').then(({readIndexHead}) => {
      readIndexHead(indexFilename, cb)
    }, cb)
  },
  readStream(indexFilename, journal, cb) {
    import('./index.js').then(({readStream}) => {
      readStream(indexFilename, journal, cb)
    }, cb)
  },
  readStreams(indexFilenames, journal, cb) {
    import('./index.js').then(({readStreams}) => {
      readStreams(indexFilenames, journal, cb)
    }, cb)
  },
  readJournal(indexFilename, journal, cb) {
    import('./index.js').then(({readJournal}) => {
      readJournal(indexFilename, journal, cb)
    }, cb)
  },
  update(directory, filename, options, cb) {
    import('./index.js').then(({update}) => {
      update(directory, filename, options, cb)
    }, cb)
  },
  matcherFns,
  statIndex(indexFilename, cb) {
    import('./index.js').then(({statIndex}) => {
      statIndex(indexFilename, cb)
    }, cb)
  },
  prettyPrint
}