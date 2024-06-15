import create from './create-update.js'
import stats from './stats.js'
import journal from './journal.js'

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

export default command
