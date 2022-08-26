const through = require('./through');
const log = require('@home-gallery/logger')('stream.pipe');

function processIndicator({name, intervalMs, totalFn, onTick, logLevel}) {
  name = name || '';
  intervalMs = intervalMs || 1000 * 10;

  let count = 0;
  let lastCount = 0;
  let lastTime = Date.now();

  const defaultTickFn = ({name, count, diff}) => {
    const total = totalFn ? totalFn() || 0 : 0;
    const msg = `Processed ${name ? name + ' ' : ''}${count}${total ? ` of ${total} (${(100 * count / total).toFixed(1)}%)` : ''} (+${diff})`
    if (logLevel == 'info') {
      log.info(lastTime, msg);
    } else {
      log.debug(lastTime, msg)
    }
  }

  onTick = onTick || defaultTickFn

  return through(function (data, _, cb) {
    count++;
    const now = Date.now();
    if (now - lastTime > intervalMs) {
      onTick({name, count: count, diff: count - lastCount, lastTime})
      lastTime = now;
      lastCount = count;
    }
    this.push(data);
    cb();
  });

}

module.exports = processIndicator;