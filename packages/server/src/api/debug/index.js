import Logger from '@home-gallery/logger'

const log = Logger('server.api.debug');

import { sendError } from '../error/index.js';

export async function debugApi(context) {
  const { config, router } = context
  const remoteConsoleToken = config?.server?.remoteConsoleToken

  if (!remoteConsoleToken) {
    return
  }

  const generateToken = () => {
    return 'xxxxxx-xxxxxx'.replace(/x/g, () => {
      const r = (Math.random() * 16 | 0) & 0x0f
      return r.toString(16)
    })
  }

  const debugToken = remoteConsoleToken?.length > 4 ? remoteConsoleToken : generateToken()

  log.warn(`Remote debug token is: ${debugToken}`)

  const requiredProperties = ['clientId', 'date', 'debugToken', 'debugSession', 'method', 'args']

  const isValidLog = (data) => {
    for (let prop of requiredProperties) {
      if (!data[prop]) {
        return false
      }
    }
    if (data.debugToken != debugToken) {
      return false
    }

    return true;
  }

  const console = (req, res) => {
    const clientLog = req.body;
    if (!isValidLog(clientLog)) {
      log.info(`Received invalid event: ${JSON.stringify(clientLog).substring(0, 120)}...`);
      return sendError(res, 400, `Invalid event data`)
    }
    if (clientLog.method == 'log') {
      log.info(clientLog, clientLog.args.join(', '))
    }
    res.sendStatus(201)
  }

  router.post('/api/debug/console', console)
}
