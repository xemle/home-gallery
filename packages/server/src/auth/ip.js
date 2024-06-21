const localIpv6prefix = '::ffff:'

const ip2int = ip => {
  if (ip.startsWith(localIpv6prefix)) {
    ip = ip.slice(localIpv6prefix.length)
  }
  const parts = ip.split('.')
  if (parts.length != 4) {
    return false
  }

  return parts.reduce((r, v) => r * 256 + +v)
}

const mask2int = m => (-1 << (32 - Math.min(32, m)))

const matchesNetwork = value => value.match(/^\d{1,3}(\.\d{1,3}(\.\d{1,3}(\.\d{1,3})?)?)?(\/\d{1,2})?$/)

const getNetwork = value => {
  const [ip, mask] = value.split('/')
  const parts = ip.split('.')
  while (parts.length < 4) {
    parts.push('0')
  }
  const n = ip2int(parts.join('.'))

  const networkMask = mask ? mask2int(+mask) : (-1 >>> 0)
  const networkPrefix = (n & networkMask)
  return [networkPrefix, networkMask]
}

export const isWhitelistIp = (rules, ip) => {
  const n = ip2int(ip)
  for (const rule of rules) {
    if (rule.value == 'all' || (rule.networkMask & n) == rule.networkPrefix) {
      return rule.type == 'allow'
    }
  }
  return true
}

export const rules2WhitelistRules = rules => {
  return rules.map(({type, value}) => {
    const [networkPrefix, networkMask] = matchesNetwork(value) ? getNetwork(value) : 
      (value == 'localhost' ? getNetwork('127/8') : [0, -1])
    return {
      type,
      value,
      networkPrefix,
      networkMask
    }
  })
}

export const defaultIpWhitelistRules = [{type: 'allow', value: '127/8'}, {type: 'deny', value: 'all'}]
