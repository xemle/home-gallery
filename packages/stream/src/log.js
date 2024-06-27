import { through } from './through.js';
import Logger from '@home-gallery/logger'

const logger = Logger('stream.log');

const fn = (data, index) => true;

export function log(name, condition) {
  name = name || '';
  condition = condition || fn;
  let index = 0;

  return through(function (data, _, cb) {
    if (condition(data, index++)) {
      logger.info((name ? name + ': ' : '') + JSON.stringify(data));
    }
    this.push(data);
    cb();
  });

}
