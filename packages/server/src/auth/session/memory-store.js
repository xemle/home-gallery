/**
 * @param {Record<string, import('../types.js').TSession>} sessions
 * @returns {import('../types.js').TSessionDataStore}
 */
export const createMemoryStore = (sessions = {}) => {
  let _sessions = sessions
  return {
    read: async () => _sessions,
    /**
     * 
     * @param {Record<string, import('../types.js').TSession>} sessions 
     * @returns 
     */
    write: async (sessions) => {
      _sessions = sessions
    },
  }
}
