const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * @param {import('express').Response} res 
 * @param {string} sessionId 
 * @param {string} sessionName 
 * @param {number} maxAge 
 */
export const setSessionCookie = (res, sessionId, sessionName = 'SESSIONID', maxAge = SESSION_COOKIE_MAX_AGE_SECONDS) => {
  const cookie = `${sessionName}=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
  res.setHeader('Set-Cookie', cookie)
}

/**
 * @param {import('express').Response} res 
 * @param {string} sessionName 
 */
export const clearSessionCookie = (res, sessionName = 'SESSIONID') => {
  res.setHeader('Set-Cookie', `${sessionName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`)
}

/**
 * @param {import('express').Request} req 
 * @param {string} sessionName 
 * @returns {string | null}
 */
export const getSessionCookie = (req, sessionName = 'SESSIONID') => {
  const cookie = req.headers['cookie'] || ''
  const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(`${sessionName}=`))
  return match ? match.slice(`${sessionName}=`.length) : null
}
