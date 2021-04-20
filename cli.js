#!/usr/bin/env node

const yargs = require('yargs');
const indexCli = require('@home-gallery/index/dist/cli');
const extractCli = require('@home-gallery/extractor/dist/cli');
const databaseCli = require('@home-gallery/database/dist/cli');
const serverCli = require('@home-gallery/server/dist/cli');
const exportCli = require('@home-gallery/export/dist/cli');

// exit if this file is only required
if (require.main !== module) {
  return;
}
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
