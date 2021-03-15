#!/usr/bin/env node

const yargs = require('yargs');
const indexCli = require('./packages/index/dist/cli');
const extractCli = require('./packages/extractor/dist/cli');
const databaseCli = require('./packages/database/dist/cli');
const serverCli = require('./packages/server/dist/cli');
const exportCli = require('./packages/export/dist/cli');

yargs.usage('Usage: $0 [global options] <command> [options]')
  .command(indexCli)
  .command(extractCli)
  .command(databaseCli)
  .command(serverCli)
  .command(exportCli)
  .demandCommand()
  .help()
  .alias('h', 'help')
  .epilog('(c) 2021 HomeGallery')
  .argv;
