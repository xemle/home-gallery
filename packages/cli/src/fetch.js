import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js'

const log = Logger('cli.fetch')

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
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
      'auto-config': {
        boolean: true,
        default: true,
        describe: 'Search for configuration on common configuration directories'
      },
    })
    .demandOption(['url', 'storage', 'database', 'events'])
  },
  handler: (argv) => {
    const argvMapping = {
      url: 'remote.url',
      insecure: 'remote.insecure',
      query: 'remote.query',
      watch: 'remote.watch',
      downloadAll: 'remote.downloadAll',
      forceDownload: 'remote.forceDownload',
      delete: 'remote.deleteLocal',

      storage: 'storage.dir',
      database: 'database.file',
      events: 'events.file',
    }

    const remoteDefaults = {
    }

    const setDefaults = (config) => {
      config.remote = {
        ...remoteDefaults,
        ...config.remote,
      }
    }

    const run = async () => {
      const { fetch } = await import('@home-gallery/fetch');

      const t0 = Date.now();
      const options = await load(argv.config, false, argv.autoConfig)

      mapArgs(argv, options.config, argvMapping)
      setDefaults(options.config)
      validatePaths(options.config, ['remote.url', 'database.file', 'storage.dir', 'events.file'])

      return fetch(options.config.remote, options)
        .then(() => {
          log.info(t0, `Fetch database from remote`);
        })
    }

    run()
      .catch(err => {
        log.error(err, `Could not fetch from remote: ${err}`);
        process.exit(1)
      })

  }
}

export default command;
