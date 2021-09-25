const crypto = require('crypto');

const matchesUser = (userMap, username, password) => {
  if (!username || !password || !userMap[username]) {
    return false
  }
  return userMap[username].testPassword(password)
}

const sha1Base64 = text => {
  var digest = crypto.createHash('sha1');
  digest.update(text, 'utf8');
  return digest.digest('base64');
}

const getTestPassword = password => {
  if (password.startsWith('{SHA}')) {
    return pwd => sha1Base64(pwd) == password.slice(5)
  } else if (password.startsWith('{PLAIN}')) {
      return pwd => pwd == password.slice(7)
  } else {
    return pwd => pwd == password
  }
}

const users2UserMap = users => {
  return users.reduce((result, {username, password}) => {
    result[username] = {
      testPassword: getTestPassword(password)
    }
    return result
  }, {})
}

module.exports = {
  users2UserMap,
  matchesUser
}