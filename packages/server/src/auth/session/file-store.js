import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

import Logger from '@home-gallery/logger'

const log = Logger('server.auth.fileStore')

/**
 * @param {string} file
 * @returns {import('../types.js').TSessionDataStore}
 */
export const createFileStore = (file) => {
  log.debug(`Use user sessions from file ${file}`)
  return {
    read: () => readSessions(file),
    /**
     * 
     * @param {Record<string, import('../types.js').TSession>} sessions 
     * @returns 
     */
    write: (sessions) => writeSessions(file, sessions),
  }
}

/**
 * @param {string} file 
 * @returns {Promise<Record<string, import('../types.js').TSession>>}
 */
async function readSessions(file) {
  try {
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    const error = /** @type {NodeJS.ErrnoException} */ (e)
    if (error?.code !== 'ENOENT') { 
      log.info(e, `Could not read sessions file ${file}: ${e}. Starting with empty sessions`)
    }
    return {}
  }
}

/**
 * @param {string} file 
 * @param {Record<string, import('../types.js').TSession>} sessions 
 */
async function writeSessions(file, sessions) {
  try {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(sessions, null, 2), 'utf8')
  } catch (e) {
    log.error(e, `Could not write sessions file ${file}: ${e}`)
  }
}
