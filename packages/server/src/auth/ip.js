const localIpv6prefix = '::ffff:'

/**
 * Converts an IP address to an integer
 * @param {string} ip
 * @returns {number | false}
 */
const ip2int = ip => {
  if (ip.startsWith(localIpv6prefix)) {
    ip = ip.slice(localIpv6prefix.length)
  }
  const parts = ip.split('.')
  if (parts.length != 4) {
    return false
  }

  return parts.reduce((r, v) => r * 256 + +v, 0)
}

/**
 * Converts a subnet mask to an integer
 * @param {number} m
 * @returns {number}
 */
const mask2int = m => (-1 << (32 - Math.min(32, m)))

/**
 * @param {string} value
 * @returns {boolean} whether the value is an ip or network definition
 */
const matchesNetwork = value => !!value.match(/^\d{1,3}(\.\d{1,3}){0,3}(\/\d{1,2})?$/)

/**
 * @param {string} value
 * @returns {[number, number]} [networkPrefix, networkMask]
 */
const getNetwork = value => {
  const [ip, mask] = value.split('/')
  const parts = ip.split('.')
  while (parts.length < 4) {
    parts.push('0')
  }
  const n = ip2int(parts.slice(0, 4).join('.'))

  const networkMask = mask ? mask2int(+mask) : (-1 >>> 0)
  const networkPrefix = n !== false ?(n & networkMask) : 0
  return [networkPrefix, networkMask]
}

/**
 * @param {import("./types.js").TNetworkRule[]} rules
 * @param {string | undefined} ip
 * @returns {boolean}
 */
export const isAllowListedIp = (rules, ip) => {
  if (!ip) {
    return false
  }
  const n = ip2int(ip)
  for (const rule of rules) {
    if (rule.value == 'all' || (n !== false && (rule.networkMask & n) == rule.networkPrefix)) {
      return rule.type == 'allow'
    }
  }
  return true
}

/**
 * @param {import("./types.js").TRule[]} rules
 * @returns {import("./types.js").TNetworkRule[]} allow list rules with parsed network definitions
 */
export const rules2AllowListRules = rules => {
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

export const defaultIpAllowListRules = [{type: 'allow', value: '127/8'}, {type: 'deny', value: 'all'}]
