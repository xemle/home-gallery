import { CliProcessManager } from '../utils/cli-process-manager.js'

import Logger from '@home-gallery/logger'

const log = Logger('cli.task.export')
const pm = new CliProcessManager()

export const exportMeta = async (config, indices) => {
  log.trace(`Exporting meta data for file indices: ${indices.join(', ')}`)
  const t0 = Date.now()
  const args = ['export', 'meta', '--index', ...indices, '--database', config.database.file, '--events', config.events.file]
  await pm.runCli(args)
  log.debug(t0, `Exported all new meta data`)
}
