const log = require('@home-gallery/logger')('cli.extract')

const command = {
  command: 'extract',
  describe: 'Extract meta data and calculate preview files',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        array: true,
        describe: 'File index'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory'
      },
      exclude: {
        alias: 'e',
        array: true,
        describe: 'Exclude gitignore pattern'
      },
      'exclude-from-file': {
        alias: 'E',
        describe: 'Exclude gitignore patterns from file'
      },
      'checksum-from': {
        alias: 'C',
        describe: 'Only entries with newer sha1 checksum date in ISO 8601 format'
      },
      'api-server': {
        describe: 'API server url',
        default: 'https://api.home-gallery.org'
      },
      'concurrent': {
        describe: 'Count of concurrent entry processing. 0 for auto',
        default: 0,
        number: true
      },
      'skip': {
        describe: 'Skip given entries before processing',
        default: 0,
        number: true
      },
      'limit': {
        describe: 'Limit amount of entry processing. 0 for no limit',
        default: 0,
        number: true
      },
      'print-entry': {
        describe: 'Logs every entry for debugging purposes',
        default: false,
        boolean: true
      },
      'geo-server': {
        describe: 'Geo address server url',
        default: 'https://nominatim.openstreetmap.org'
      },
      'geo-address-language': {
        describe: 'Preferred address languages for geo code reverse lookups',
        array: true,
        default: ['en', 'de']
      },
      'journal': {
        describe: 'File index journal suffix',
        string: true
      }
    })
    .demandOption(['index', 'storage'])
  },
  handler: (argv) => {
    const extract = require('@home-gallery/extractor');
    const { fileFilter } = require('@home-gallery/common');

    const t0 = Date.now();
    fileFilter(argv.exclude, argv['exclude-from-file'], (err, fileFilterFn) => {
      if (err) {
        log.error(err);
      } else {
        const config = {
          indexFilenames: argv.index,
          storageDir: argv.storage,
          fileFilterFn,
          minChecksumDate: argv['checksum-from'],
          apiServerUrl: argv['api-server'],
          concurrent: argv['concurrent'],
          skip: argv['skip'],
          limit: argv['limit'],
          printEntry: argv['print-entry'],
          geoAddressLanguage: argv['geo-address-language'],
          geoServerUrl: argv['geo-server'],
          journal: argv.journal
        }
        extract(config, (err, count) => {
          if (err) {
            log.error(`Could not extract all meta data and preview files: ${err}`);
          } else {
            log.info(t0, `Extract all meta data and calculated all preview files from ${count} entries`);
          }
        })
      }
    })
  }
}

module.exports = command;
