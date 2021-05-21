const debug = require('debug')('stream:limit');

const filter = require('./filter');

function limit(amount) {
  amount = typeof amount == 'undefined' ? 0 : +amount
  if (amount > 0) {
    debug(`Limit stream to ${amount} entries`)
  }

  let count = 0;
  return filter(() => amount <= 0 || count++ < amount)
}

module.exports = limit;