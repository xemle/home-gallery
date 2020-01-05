const yargs = require('yargs');
const indexCli = require('./lib/index/cli');
const extractCli = require('./lib/extract/cli');
const buildCli = require('./lib/build/cli');
const serverCli = require('./lib/server/cli');

yargs.usage('Usage: $0 [global options] <command> [options]')
  .command(indexCli)
  .command(extractCli)
  .command(buildCli)
  .command(serverCli)
  .demandCommand()
  .help()
  .alias('h', 'help')
  .epilog('(c) 2019 Clould Gallery')
  .argv;
