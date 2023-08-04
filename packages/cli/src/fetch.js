const log = require('@home-gallery/logger')('cli.fetch')

const command = {
  command: 'fetch',
  describe: 'Fetch and merge from remote',
  builder: (yargs) => {
    return yargs.option({
      'server-url': {
        alias: ['u', 'url'],
        describe: 'Gallery server url'
      },
      insecure: {
        alias: 'k',
        boolean: true,
        describe: 'Do not verify HTTPS certificates'
      },
      query: {
        alias: 'q',
        string: true,
        describe: 'Search query'
      },
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory'
      },
      delete: {
        alias: 'D',
        boolean: true,
        default: false,
        describe: 'Delete local files which are missing remote for all remote index'
      },
      watch: {
        alias: 'w',
        boolean: true,
        default: false,
        describe: 'Watch server for database change and fetch remote on changes'
      },
      'force-download': {
        boolean: true,
        default: false,
        describe: 'Force to download and overwrite preview files. Use this option if the remote preview content changed (e.g. through a fix)'
      },
      'download-all': {
        boolean: true,
        default: false,
        describe: 'Download preview files from all remote entries. Use this option if preview files are missing from remote'
      },
    })
    .demandOption(['url', 'storage', 'database', 'events'])
  },
  handler: (argv) => {
    const { fetch } = require('@home-gallery/fetch');
    const options = {
      serverUrl: argv.url,
      databaseFile: argv.database,
      storageDir: argv.storage,
      eventFile: argv.events,
      insecure: argv.insecure,
      query: argv.query,
      deleteLocal: argv.delete,
      watch: argv.watch,
      forceDownload: argv.forceDownload,
      downloadAll: argv.downloadAll
    }
    const t0 = Date.now();
    fetch(options)
      .catch(() => process.exit(1))
  }
}

module.exports = command;
