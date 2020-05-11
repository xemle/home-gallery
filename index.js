const yargs = require('yargs');
const indexCli = require('./packages/index/src/cli');
const extractCli = require('./packages/extractor/src/cli');
const databaseCli = require('./packages/database/src/cli');
const serverCli = require('./packages/server/src/cli');

yargs.usage('Usage: $0 [global options] <command> [options]')
  .command(indexCli)
  .command(extractCli)
  .command(databaseCli)
  .command(serverCli)
  .demandCommand()
  .help()
  .alias('h', 'help')
  .epilog('(c) 2019 Clould Gallery')
  .argv;
