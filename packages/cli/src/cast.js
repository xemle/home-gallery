const log = require('@home-gallery/logger')('cli.cast')

const command = {
  command: 'cast',
  describe: 'Cast media slideshow to Google Chromecast',
  builder: (yargs) => {
    return yargs.option({
      'server-url': {
        alias: ['u', 'url'],
        describe: 'Gallery server url'
      },
      query: {
        alias: 'q',
        string: true,
        describe: 'Search query'
      },
      proxy: {
        boolean: true,
        default: true,
        describe: 'Use HTTP proxy. Chromecast does not support internal DNS and self-signed certificates. The proxy bypasses this limit. Use --no-proxy to disable it for public galleries'
      },
      'proxy-ip': {
        describe: 'Use given IP for proxy. Auto detect if not given'
      },
      port: {
        alias: 'p',
        number: true,
        default: 38891,
        describe: 'Proxy port'
      },
      insecure: {
        alias: 'k',
        boolean: true,
        describe: 'Do not verify HTTPS certificates. Disable it by --no-insecure if you know what you do'
      },
      random: {
        alias: ['shuffle', 's'],
        boolean: true,
        describe: 'Randomize playback. Use --no-random for linear order'
      },
      reverse: {
        alias: ['r'],
        boolean: true,
        describe: 'Reverse order. Default order is by date oldest first'
      },
      delay: {
        number: true,
        default: 5,
        describe: 'Delay between the images in seconds'
      },
      'max-preview-size': {
        number: true,
        default: 1920,
        describe: 'Maximum size of preview images'
      }
    })
    .demandOption(['server-url'])
  },
  handler: (argv) => {
    const { cast } = require('@home-gallery/cast');
    const options = {
      serverUrl: argv.url,
      query: argv.query,
      useProxy: argv.proxy,
      proxyIP: argv.proxyIp,
      port: argv.port,
      insecure: argv.insecure,
      random: argv.random,
      reverse: argv.reverse,
      delay: argv.delay * 1000,
      maxPreviewSize: argv.maxPreviewSize
    }
    const t0 = Date.now();
    cast(options)
      .then(() => {
        log.info(t0, `Cast from gallery ${options.serverUrl}`)
      })
      .catch(err => {
        log.error(err, `Cast from gallery ${options.serverUrl} failed: ${err}`)
        process.exit(1)
      })
  }
}

module.exports = command;
