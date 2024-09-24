import Logger from '@home-gallery/logger'

const log = Logger('stream.skip');

import { filter } from './filter.js';

export function skip(amount) {
  amount = +amount || 0
  if (amount > 0) {
    log.info(`Skip first ${amount} stream entries`)
  }

  let count = 0;
  return filter(() => count++ >= amount)
}
