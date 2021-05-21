const through2 = require('through2');
const debug = require('debug')('stream:pipe');

function processIndicator({name, intervalMs, totalFn, onTick}) {
  name = name || '';
  intervalMs = intervalMs || 1000 * 10;

  let count = 0;
  let lastCount = 0;
  let last = Date.now();

  const defaultTickFn = ({name, count, diff}) => {
    const total = totalFn ? totalFn() || 0 : 0;
    debug(`Processed ${name ? name + ' ' : ''}${count}${total ? ` of ${total} (${(100 * count / total).toFixed(1)}%)` : ''} (+${diff})`);
  }

  onTick = onTick || defaultTickFn

  return through2.obj(function (data, enc, cb) {
    count++;
    const now = Date.now();
    if (now - last > intervalMs) {
      onTick({name, count: count, diff: count - lastCount})
      last = now;
      lastCount = count;
    }
    this.push(data);
    cb();
  });

}

module.exports = processIndicator;