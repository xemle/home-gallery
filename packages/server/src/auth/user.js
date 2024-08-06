import crypto from 'crypto';

export const matchesUser = (userMap, username, password) => {
  if (!username || !password || !userMap[username]) {
    return false
  }
  return userMap[username].testPassword(password)
}

const hashBase64 = (text, hash = 'sha1') => {
  var digest = crypto.createHash(hash);
  digest.update(text, 'utf8');
  return digest.digest('base64');
}

const getTestPassword = password => {
  if (password.startsWith('{SHA256-salted}')) {
    const pos = password.indexOf('.')
    const salt = Buffer.from(password.substring(15, pos), 'base64').toString()
    return pwd => hashBase64(salt + pwd, 'sha256') == password.substring(pos + 1)
  } else if (password.startsWith('{SHA}')) {
    return pwd => hashBase64(pwd) == password.slice(5)
  } else if (password.startsWith('{PLAIN}')) {
      return pwd => pwd == password.slice(7)
  } else {
    return pwd => pwd == password
  }
}

export const users2UserMap = users => {
  return users.reduce((result, {username, password}) => {
    result[username] = {
      testPassword: getTestPassword(password)
    }
    return result
  }, {})
}
