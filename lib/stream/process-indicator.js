const through2 = require('through2');
const debug = require('debug')('stream:pipe');

function processIndicator({name, intervalMs}) {
  name = name || '';
  intervalMs = intervalMs || 1000 * 10;

  let counter = 0;
  let lastCounter = 0;
  let lastOutput = Date.now();

  return through2.obj(function (data, enc, cb) {
    counter++;
    const now = Date.now();
    if (now - lastOutput > intervalMs) {
      debug(`Processed ${name ? name + ' ' : ''}${counter} (+${counter - lastCounter})`);
      lastOutput = now;
      lastCounter = counter;
    }
    this.push(data);
    cb();
  });

}

module.exports = processIndicator;