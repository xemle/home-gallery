const log = require('@home-gallery/logger')('cli.config.mapArgs')

const getSegment = (config, path, create = true) => {
  const parts = path.split('.')
  let segment = config
  for (let i = 0; i < parts.length - 1; i++) {
    if (!segment[parts[i]] && !create) {
      return []
    } else if (!segment[parts[i]]) {
      segment[parts[i]] = {}
    }
    segment = segment[parts[i]]
  }
  return [segment, parts[parts.length - 1]]
}

const safeStringify = value => {
  const json = JSON.stringify(value)
  return json.replace(/"(pass\w*|auth\w*|key)":"([^\"]*)"/g, (_, prop) => `"${prop}":"***"`)
}

const setTo = (config, path, value) => {
  const [segment, name] = getSegment(config, path)
  segment[name] = value
  log.trace(`Set config path ${path} to ${safeStringify(value)}`)
}

const addTo = (config, path, value) => {
  const [segment, name] = getSegment(config, path)
  if (!segment[name] || !Array.isArray(segment[name])) {
    segment[name] = []
  }
  if (Array.isArray(value)) {
    segment[name].push(...value)
  } else {
    segment[name].push(value)
  }
  log.trace(`Add ${safeStringify(value)} to config path ${path}`)
}

const mapArgs = (argv, config, mapping) => {
  Object.entries(mapping).forEach(([key, value]) => {
    if (typeof argv[key] == 'undefined') {
      return
    }

    if (typeof value == 'string') {
      setTo(config, value, argv[key])
    } else if (typeof value.path == 'string') {
      const map = typeof value.map == 'function' ? value.map : v => v
      if (value.type == 'add') {
        addTo(config, value.path, map(argv[key]))
      } else {
        setTo(config, value.path, map(argv[key]))
      }
    }
  })
  return config
}

const mapConfig = (config, mappings) => {
  Object.entries(mappings).forEach(([path, value]) => {
    const [segment, name] = getSegment(config, path, false)
    if (!segment || typeof segment[name] == 'undefined') {
      return
    }
    const configValue = segment[name]

    if (typeof value == 'function') {
      const mappedValue = Array.isArray(configValue) ? configValue.map(value) : value(configValue)
      setTo(config, path, mappedValue)
    } else {
      setTo(config, path, value)
    }
  })
  return config
}

module.exports = {
  mapArgs,
  mapConfig
}
