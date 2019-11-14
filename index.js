const cli = require('./lib/cli');

const args = process.argv.slice(2);

const options = cli.parseArgs(args);
cli.run(options);