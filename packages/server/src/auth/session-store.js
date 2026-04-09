import fs from 'fs'
import crypto from 'crypto'

import Logger from '@home-gallery/logger'

const log = Logger('server.auth.sessionStore')

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const readSessions = (file) => {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      log.warn(e, `Could not read sessions file ${file}: ${e}. Starting with empty sessions`)
    }
    return {}
  }
}

const writeSessions = (file, sessions) => {
  try {
    fs.writeFileSync(file, JSON.stringify(sessions, null, 2), 'utf8')
  } catch (e) {
    log.error(e, `Could not write sessions file ${file}: ${e}`)
  }
}

export const createSessionStore = (file) => {
  let sessions = readSessions(file)

  const pruneExpired = () => {
    const now = Date.now()
    const before = Object.keys(sessions).length
    sessions = Object.fromEntries(
      Object.entries(sessions).filter(([, s]) => new Date(s.expires).getTime() > now)
    )
    const removed = before - Object.keys(sessions).length
    if (removed) {
      log.debug(`Pruned ${removed} expired sessions`)
      writeSessions(file, sessions)
    }
  }

  pruneExpired()

  return {
    createSession(username, roles, readOnly) {
      const id = crypto.randomBytes(32).toString('hex')
      const now = new Date()
      sessions[id] = {
        username,
        roles: roles || [],
        readOnly: readOnly || false,
        created: now.toISOString(),
        expires: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      }
      writeSessions(file, sessions)
      return id
    },

    getSession(id) {
      const session = sessions[id]
      if (!session) {
        return null
      }
      if (new Date(session.expires).getTime() <= Date.now()) {
        this.deleteSession(id)
        return null
      }
      return session
    },

    deleteSession(id) {
      if (sessions[id]) {
        delete sessions[id]
        writeSessions(file, sessions)
      }
    },
  }
}
