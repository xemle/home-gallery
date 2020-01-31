const through2 = require('through2');
const debug = require('debug')('stream:pipe');

function processIndicator({name, intervalMs, totalFn}) {
  name = name || '';
  intervalMs = intervalMs || 1000 * 10;

  let counter = 0;
  let lastCounter = 0;
  let lastOutput = Date.now();

  return through2.obj(function (data, enc, cb) {
    counter++;
    const now = Date.now();
    if (now - lastOutput > intervalMs) {
      const total = totalFn ? totalFn() || 0 : 0;
      debug(`Processed ${name ? name + ' ' : ''}${counter}${total ? ` of ${total} ${(100 * counter / total).toFixed(1)}%` : ''} (+${counter - lastCounter})`);
      lastOutput = now;
      lastCounter = counter;
    }
    this.push(data);
    cb();
  });

}

module.exports = processIndicator;