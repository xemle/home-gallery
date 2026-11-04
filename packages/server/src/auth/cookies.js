const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days in seconds

export const setSessionCookie = (res, sessionId) => {
    const cookie = `SESSIONID=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`;
    res.setHeader('Set-Cookie', cookie)
}

export const clearSessionCookie = (res) => {
    res.setHeader('Set-Cookie', 'SESSIONID=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
}

/**
 *  @returns {string | null}
 */
export const getSessionCookie = (req) => {
    const cookie = req.headers['cookie'] || ''
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('SESSIONID='))
    return match ? match.slice('SESSIONID='.length) : null
}