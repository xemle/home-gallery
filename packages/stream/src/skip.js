const log = require('@home-gallery/logger')('stream.skip');

const filter = require('./filter');

function skip(amount) {
  amount = +amount || 0
  if (amount > 0) {
    log.info(`Skip first ${amount} stream entries`)
  }

  let count = 0;
  return filter(() => count++ >= amount)
}

module.exports = skip;