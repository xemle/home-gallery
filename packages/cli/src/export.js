const log = require('@home-gallery/logger')('cli.export')

const command = {
  command: 'export',
  describe: 'Export commands',
  builder: (yargs) => {
    return yargs.option({
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      }
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
            alias: 'b',
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
        const { exportBuilder } = require('../../export-static/dist');
        const options = {
          eventsFilename: argv.events,
          outputDirectory: argv.output,
          basePath: argv['base-path'],
          archiveFilename: argv.file,
          keep: argv.keep,
          query: argv.query,
          disabledEdit: !argv.edit
        }
        const t0 = Date.now();
        exportBuilder(argv.database, argv.storage, options, (err, outputDirectory, archiveFilename) => {
          if (err) {
            log.error(`Export failed: ${err}`);
          } else {
            log.info(t0, `Created export to ${archiveFilename ? archiveFilename : outputDirectory}`);
          }
        });
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
        const { exportMeta } = require('@home-gallery/export-meta')

        const options = {
          indices: argv.index,
          database: argv.database,
          events: argv.events,
          changesAfter: argv.changesAfter,
          dryRun: argv.dryRun
        }

        const run = async (options) => {
          return exportMeta(options)
        }

        log.info(`Exporting meta data to sidecar files${options.dryRun? ' in dry run mode' : ''}`)
        const t0 = Date.now();
        run(options)
          .then((updatedFiles) => {
            if (updatedFiles.length) {
              log.info(t0, `Exported meta data to ${updatedFiles.length} sidecar files${options.dryRun? ' (dry run)' : ''}`)
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

module.exports = command;
