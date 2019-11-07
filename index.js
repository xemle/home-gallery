const path = require('path');
const debug = require('debug')('core');
const walk = require('./walker');

const args = process.argv.slice(2);
const dir = path.resolve(args[0] || '.');



createFsStat(dir, (err, result) => {
  if (err) {
    debug(`Error: ${err}`);
    return;
  }
  debug(`${JSON.stringify(result, null, 2)}`);
})
