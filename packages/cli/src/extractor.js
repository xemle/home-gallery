import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js';

const log = Logger('cli.extract')

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
    const isNotUndefined = value => typeof value != 'undefined'
    const hasArrayValues = values => values.filter(isNotUndefined).length > 0
    const splitArrayValues = values => values.filter(isNotUndefined).map(v => v.split(',')).reduce((r, v) => r.concat(v), [])

    const minMaxRange = (min, value, max) => Math.max(min, Math.min(max, value))

    const argvMapping = {
      index: 'fileIndex.files',
      checksumFrom: 'fileIndex.minChecksumDate',
      journal: 'fileIndex.journal',
      storage: 'storage.dir',
      exclude: 'extractor.excludes',
      excludeFromFile: 'extractor.excludeFromFile',
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
        ext: 'mp4',
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

    const setDefaults = (config) => {
      config.fileIndex = {
        files: config.sources?.filter(s => !s.offline).map(s => s.index),
        ...config.fileIndex
      }
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
      // for version <= v1.4.1 apiServer was a string for api server url
      if (typeof config.extractor?.apiServer == 'string') {
        config.extractor.apiServer = { url: config.extractor.apiServer }
      }
      if (config.extractor?.geoAddressLanguage) {
        config.extractor.geoReverse.addressLanguage = config.extractor?.geoAddressLanguage
      }
    }

    const run = async (argv) => {
      const { extract } = await import('@home-gallery/extractor');

      const options = await load(argv.config, false, argv.autoConfig)

      mapArgs(argv, options.config, argvMapping)
      setDefaults(options.config)
      migrateConfig(options.config)
      validatePaths(options.config, ['fileIndex.files', 'storage.dir'])

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

export default command;
