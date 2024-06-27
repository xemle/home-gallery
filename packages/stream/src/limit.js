import Logger from '@home-gallery/logger'

const log = Logger('stream.limit');

import { filter } from './filter.js';

export function limit(amount) {
  amount = typeof amount == 'undefined' ? 0 : +amount
  if (amount > 0) {
    log.info(`Limit stream to ${amount} entries`)
  }

  let count = 0;
  return filter(() => amount <= 0 || count++ < amount)
}
