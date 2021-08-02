#!/usr/bin/env node

const { loggerOptions, loggerMiddleware } = require('./logger')

const yargs = require('yargs');
const fileIndexCli = require('./file-index');
const extractCli = require('./extractor');
const databaseCli = require('./database');
const serverCli = require('./server');
const exportCli = require('./export');
const interactiveCli = require('./interactive');
const runCli = require('./run')

const cli = () => {
  yargs.usage('Usage: $0 [global options] <command> [options]')
    .env('GALLERY')
    .options(loggerOptions)
    .middleware(loggerMiddleware)
    .command(fileIndexCli)
    .command(extractCli)
    .command(databaseCli)
    .command(serverCli)
    .command(exportCli)
    .command(interactiveCli)
    .command(runCli)
    .demandCommand()
    .help()
    .alias('h', 'help')
    .epilog('(c) 2021 HomeGallery - https://home-gallery.org')
    .argv;
}

module.exports = cli;
