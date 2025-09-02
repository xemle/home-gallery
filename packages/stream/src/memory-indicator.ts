import { through } from './through.js';
import Logger from '@home-gallery/logger'

const log = Logger('stream.memory');

export function memoryIndicator({name, intervalMs}) {
  intervalMs = intervalMs || 1000 * 10;

  let lastOutput = false;

  return through(function (data, _, cb) {
    const now = Date.now();
    if (!lastOutput || now - lastOutput > intervalMs) {
      const usage = process.memoryUsage();
      const list = Object.entries(usage).map(([key, value]) => {
        const mb = (value / 1024 / 1024).toFixed(1);
        return `${key}: ${mb} MB`
      })
      log.debug(`Used memory${name ? ` (${name})` : ''}: ${list.join(', ')}`)
      lastOutput = now;
    }
    this.push(data);
    cb();
  });

}
