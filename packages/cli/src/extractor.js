const { load, mapArgs, getMissingPaths } = require('./config');

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
        describe: 'API server url for image similarity, face and object detection',
      },
      'api-server-timeout': {
        describe: 'Timeout for api server calls in seconds',
        number: true,
      },
      'api-server-concurrent': {
        describe: 'Concurrent calls to api server',
        number: true,
      },
      'concurrent': {
        describe: 'Count of concurrent entry processing. 0 for auto. Set it to 1 on extrator issues',
        number: true
      },
      'skip': {
        describe: 'Skip given entries before processing',
        number: true
      },
      'limit': {
        describe: 'Limit amount of entry processing. 0 for no limit',
        number: true
      },
      'print-entry': {
        describe: 'Logs every entry for debugging purposes',
        boolean: true
      },
      'geo-server': {
        describe: 'Geo address server url',
      },
      'geo-address-language': {
        describe: 'Preferred address languages for geo code reverse lookups',
        array: true,
      },
      'journal': {
        describe: 'File index journal suffix',
        string: true
      },
      'use-native': {
        array: true,
        describe: 'Use native system executables. Possible values are exitool, vipsthumbnail, convert, ffprobe or ffmpeg',
        string: true,
      }
    })
    .demandOption(['index'])
    .default('api-server', undefined, 'https://api.home-gallery.org')
    .default('api-server-timeout', undefined, '30')
    .default('api-server-concurrent', undefined, '5')
    .default('geo-server', undefined, 'https://nominatim.openstreetmap.org')
    .default('geo-address-language', undefined, 'en')
    .default('use-native', undefined, '')
    .default('concurrent', undefined, '0')
    .default('skip', undefined, '0')
    .default('limit', undefined, '0')
    .default('printEntry', undefined, 'false')
  },
  handler: (argv) => {
    const extract = require('@home-gallery/extractor');
    const { fileFilter, promisify } = require('@home-gallery/common');
    const fileFilterAsync = promisify(fileFilter)

    const isNotUndefined = value => typeof value != 'undefined'
    const hasArrayValues = values => values.filter(isNotUndefined).length > 0
    const splitArrayValues = values => values.filter(isNotUndefined).map(v => v.split(',')).reduce((r, v) => r.concat(v), [])

    const minMaxRange = (min, value, max) => Math.max(min, Math.min(max, value))

    const mapping = {
      index: 'sources.indexFilenames',
      checksumFrom: 'sources.minChecksumDate',
      journal: 'sources.journal',
      storage: 'storage.dir',
      apiServer: 'extractor.apiServer.url',
      apiServerTimeout: {path: 'extractor.apiServer.timeout', map: value => minMaxRange(1, value, 300)},
      apiServerConcurrent: {path: 'extractor.apiServer.concurrent', map: value => minMaxRange(1, value, 20)},
      concurrent: 'extractor.stream.concurrent',
      skip: 'extractor.stream.skip',
      limit: 'extractor.stream.limit',
      printEntry: 'extractor.stream.printEntry',
      useNative: {path: 'extractor.useNative', test: hasArrayValues, map: splitArrayValues},
      geoServer: 'extractor.geoReverse.url',
      geoAddressLanguage: {path: 'extractor.geoReverse.addressLanguage', test: hasArrayValues, map: splitArrayValues},
    }

    const requiredPaths = [
      'storage.dir'
    ]

    const extractorDefaults = {
      stream: {
        concurrent: 0,
        skip: 0,
        limit: 0,
        printEntry: false
      },
      image: {
        previewSizes: [1920, 1280, 800, 320, 128],
        previewQuality: 80
      },
      video: {
        previewSize: 720,
      },
      apiServer: {
        url: 'https://api.home-gallery.org',
        timeout: 30,
        concurrent: 5
      },
      geoReverse: {
        url: 'https://nominatim.openstreetmap.org',
        addressLanguage: 'en'
      },
    }

    const setDefaults = config => {
      config.extractor = {
        ...extractorDefaults,
        ...config.extractor,
        stream: {...extractorDefaults.stream, ...config.extractor?.stream},
        image: {...extractorDefaults.image, ...config.extractor?.image},
        video: {...extractorDefaults.video, ...config.extractor?.video},
        apiServer: {...extractorDefaults.apiServer, ...config.extractor?.apiServer},
        geoReverse: {...extractorDefaults.geoReverse, ...config.extractor?.geoReverse},
      }
    }

    const migrateConfig = (config) => {
      if (config.extractor?.geoAddressLanguage) {
        config.extractor.geoReverse.addressLanguage = config.extractor?.geoAddressLanguage
      }
    }

    const run = async (argv) => {
      const options = await load(argv.config, false)

      mapArgs(argv, options.config, mapping)
      options.config.sources.fileFilterFn = await fileFilterAsync(argv.exclude, argv['exclude-from-file'])

      const missingPaths = getMissingPaths(options.config, requiredPaths)
      if (missingPaths.length) {
        throw new Error(`Missing config paths ${missingPaths.join(', ')}`)
      }

      setDefaults(options.config)
      migrateConfig(options.config)
      return extract(options)
    }

    const t0 = Date.now();
    run(argv)
      .then(count => {
        log.info(t0, `Extract all meta data and calculated all preview files from ${count} entries`);
      })
      .catch(err => {
        log.error(err, `Could not extract all meta data and preview files: ${err}`);
      })
  }
}

module.exports = command;
