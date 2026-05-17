/**
 * @param {import('express').Request} req
 * @returns
 */
export function getCredentials(req) {
  if (!req.headers?.authorization) {
    return []
  }
  const [schema, base64Auth] = req.headers.authorization.split(' ')
  if (schema == 'Basic') {
    const userInfo = Buffer.from(base64Auth, 'base64').toString()
    const pos = userInfo.indexOf(':')
    if (pos < 0) {
      return []
    }
    return [userInfo.substring(0, pos), userInfo.substring(pos + 1)]
  }
  return []
}