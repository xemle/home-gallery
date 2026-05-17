import crypto from 'crypto'

import Logger from '@home-gallery/logger'

const log = Logger('server.auth.sessionStore')

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const SESSION_UPDATE_MS = 1 * 24 * 60 * 60 * 1000 // 1 days

/**
 * 
 * @param {import('../types.js').TSessionDataStore} store 
 * @param {number} sessionTTLMs 
 * @param {number} sessionUpdateMs 
 * @returns {Promise<import('../types.js').TSessionStore>}
 */
export async function createSessionStore(store, sessionTTLMs = SESSION_TTL_MS, sessionUpdateMs = SESSION_UPDATE_MS) {
  let sessions = await store.read()

  async function pruneExpired() {
    const now = Date.now()
    const before = Object.keys(sessions).length
    sessions = Object.fromEntries(
      Object.entries(sessions).filter(([, s]) => new Date(s.expires).getTime() > now)
    )
    const removed = before - Object.keys(sessions).length
    if (removed) {
      log.debug(`Pruned ${removed} expired sessions`)
      await store.write(sessions)
    }
  }

  await pruneExpired()

  /** @type {import('../types.js').TSessionStore} */
  const sessionStore = {
    async createSession(username) {
      const id = crypto.randomUUID()
      const now = new Date()
      sessions[id] = {
        username,
        created: now.toISOString(),
        updated: now.toISOString(),
        expires: new Date(now.getTime() + sessionTTLMs).toISOString(),
      }
      await store.write(sessions)
      return id
    },

    /**
     * @param {string} id 
     * @returns {Promise<import('../types.js').TSession | null>}
     */
    async getSession(id) {
      const session = sessions[id]
      if (!session) {
        return null
      }
      const now = Date.now()
      if (new Date(session.expires).getTime() <= now) {
        await this.deleteSession(id)
        return null
      }

      // refresh session if it's old
      if (now - new Date(session.updated).getTime() >= sessionUpdateMs) {
        session.updated = new Date(now).toISOString()
        session.expires = new Date(now + sessionTTLMs).toISOString()
        await store.write(sessions)
      }
      
      return session
    },

    /**
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async deleteSession(id) {
      if (sessions[id]) {
        delete sessions[id]
        return store.write(sessions)
      }
    },
  }
  
  return sessionStore
}
