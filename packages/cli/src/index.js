#!/usr/bin/env node

import { loggerOptions, loggerMiddleware } from './logger.js'

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fileIndexCli from './file-index/index.js';
import extractCli from './extractor.js';
import databaseCli from './database.js';
import serverCli from './server.js';
import storageCli from './storage.js';
import exportCli from './export.js';
import fetchCli from './fetch.js';
import castCli from './cast.js';
import interactiveCli from './interactive/index.js';
import runCli from './run.js'
import pluginCli from './plugin.js'

export const cli = (version = '1.0.0') => {
  return yargs(hideBin(process.argv))
    .usage('Usage: $0 [global options] <command> [options]')
    .version(version)
    .env('GALLERY')
    .options(loggerOptions)
    .default('level', undefined, 'debug')
    .middleware(loggerMiddleware)
    .command(fileIndexCli)
    .command(extractCli)
    .command(databaseCli)
    .command(serverCli)
    .command(storageCli)
    .command(exportCli)
    .command(fetchCli)
    .command(castCli)
    .command(interactiveCli)
    .command(runCli)
    .command(pluginCli)
    .demandCommand()
    .help()
    .alias('h', 'help')
    .epilog('(c) 2024 HomeGallery - https://home-gallery.org')
    .parse();
}
