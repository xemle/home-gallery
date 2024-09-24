import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js'

const log = Logger('cli.export')

const command = {
  command: 'export',
  describe: 'Export commands',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
      'auto-config': {
        boolean: true,
        default: true,
        describe: 'Search for configuration on common configuration directories'
      },
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      },
    })
    .command(
      ['static', '$0'],
      'Create a static website export',
      (yargs) => yargs
        .options({
          storage: {
            alias: 's',
            describe: 'Storage directory'
          },
          output: {
            alias: 'o',
            describe: 'Output directory of export'
          },
          file: {
            alias: 'f',
            type: 'string',
            describe: 'Archive filename of export. Must end with .zip or .tar.gz'
          },
          keep: {
            alias: 'k',
            type: 'boolean',
            describe: 'Keep outputdirectory on archives'
          },
          query: {
            alias: 'q',
            type: 'string',
            describe: 'Search query for matching entries'
          },
          'base-path': {
            alias: ['b', 'prefix'],
            type: 'string',
            default: '/',
            describe: 'Base path of static page. e.g. "/gallery"'
          },
          'edit': {
            type: 'boolean',
            default: false,
            describe: 'Enable edit menu'
          }
        })
        .demandOption(['storage', 'database']),
      (argv) => {
        const argvMapping = {
          database: 'database.file',
          events: 'events.file',
          storage: 'storage.dir',

          output: 'export.dir',
          basePath: 'export.basePath',
          file: 'export.archiveFile',
          keep: 'export.keepDir',
          query: 'export.query',
          edit: {path: 'export.disableEdit', map: v => !v},
        }

        const run = async() => {
          const { exportBuilder } = await import('@home-gallery/export-static')
          const { promisify } = await import('@home-gallery/common')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, argvMapping)
          validatePaths(options.config, ['database.file', 'storage.dir', 'export.dir'])

          const asyncExportBuilder = promisify(exportBuilder)
          return asyncExportBuilder(options)
        }

        const t0 = Date.now();
        return run()
          .then((dir, archiveFile) => {
            log.info(t0, `Created export to ${archiveFile ? archiveFile : dir}`);
          })
          .catch(err => {
            log.error(`Export failed: ${err}`);
            process.exit(1)
          })

      }
    )
    .command(
      ['meta'],
      'Export meta data to xmp sidecar files',
      (yargs) => yargs
        .options({
          index: {
            alias: 'i',
            describe: 'Index file',
            array: true
          },
          'changes-after': {
            alias: 'A',
            string: true,
            describe: 'Only write meta data changes after given date (in ISO 8601)'
          },
          'dry-run': {
            alias: 'n',
            boolean: true,
            default: false,
            describe: 'Do not perform any writes'
          },
        })
        .demandOption(['index', 'database']),
      (argv) => {
        const mapping = {
          index: 'fileIndex.files',
          database: 'database.file',
          events: 'events.file',

          changesAfter: 'exportMeta.changesAfter',
          dryRun: 'exportMeta.dryRun'
        }

        const setDefaults = (config) => {
          config.fileIndex = {
            files: config.sources?.filter(s => !s.offline).map(s => s.index),
            ...config.fileIndex
          }
        }

        const run = async () => {
          const { exportMeta } = await import('@home-gallery/export-meta')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, mapping)
          setDefaults(options.config)
          validatePaths(options.config, ['fileIndex.files', 'database.file', 'events.file'])

          return exportMeta(options)
        }

        log.info(`Exporting meta data to sidecar files${argv.dryRun? ' in dry run mode' : ''}`)
        const t0 = Date.now();
        return run()
          .then((updatedFiles) => {
            if (updatedFiles.length) {
              log.info(t0, `Exported meta data to ${updatedFiles.length} sidecar files${argv.dryRun? ' (dry run)' : ''}`)
            } else {
              log.info(t0, `No new meta data exported`)
            }
          })
          .catch(e => {
            log.error(e, `Failed to export meta data: ${e}`)
            process.exit(1)
          })
      }
    )
  }
}

export default command;
