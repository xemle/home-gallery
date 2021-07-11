const create = require('./create-update')
const stats = require('./stats')
const journal = require('./journal')

const command = {
  command: 'index',
  describe: 'File index',
  builder: (yargs) => {
    return yargs
      .command(create)
      .command(journal)
      .command(stats)
  }
}

module.exports = command
