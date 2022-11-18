const log = require('@home-gallery/logger')('cli.export')

const command = {
  command: 'export',
  describe: 'Create a static export',
  builder: (yargs) => {
    return yargs.option({
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
    .demandOption(['storage', 'database'])
  },
  handler: (argv) => {
    const { exportBuilder } = require('@home-gallery/export');
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
}

module.exports = command;
