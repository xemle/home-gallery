const path = require('path')

const resolveKey = (obj, key) => {
  const parts = key.split('.');
  let parent = obj;
  let prop = false;
  while (parts.length && typeof obj[parts[0]] != 'undefined') {
    prop = parts.shift();
    parent = obj;
    obj = parent[prop];
  }
  if (parts.length) {
    return [parent, false]
  }
  return [parent, prop];
}

const envName = key => 'GALLERY_' + key.replace(/([A-Z])/g, c => `_${c}`).toUpperCase().replace(/[^_A-Z]/g, '_')

const resolveEnv = (env, key) => {
  const name = envName(key)
  return env[name] ? [env, name] : [env, false]
}

const envDefault = (env, key, defaultValue) => {
  const name = envName(key)
  return env[name] ? env[name] : defaultValue
}

const useEnvDefaults = (config, env) => {
  Object.entries(config).forEach(([key, value]) => {
    config[key] = envDefault(env, key, value)
  })
}

const resolveEnvOrKey = (env, obj, key) => {
  const [p, k] = resolveEnv(env, key)
  return k ? [p, k] : resolveKey(obj, key)
}

const resolve = (obj, key, config, env) => {
  const [parent, prop] = resolveEnvOrKey(env, obj, key);
  if (!prop || typeof parent[prop] !== 'string') {
    return;
  }

  parent[prop] = parent[prop]
    // resolve ~ to users home
    .replace(/^~/, env.HOME)
    .replace(/^\.([\\/]|$)/, (_, s) => `${env.CWD}${s}`)
    // resolve function currently only '{basename(dir)}'
    .replace(/\{\s*([^}]+)\(([^)]+)\)\s*\}/g, (_, fn, name) => {
      const [p, k] = resolveEnvOrKey(env, {...config, ...obj}, name)
      return k && fn === 'basename' ? path.basename(p[k]) : ''
    })
    // resolve variable eg. '{baseDir}'
    .replace(/\{\s*([^}]+)\s*\}/g, (_, name) => {
      const [p, k] = resolveEnvOrKey(env, {...config, ...obj}, name);
      return prop ? p[k] : '';
    })
}

const resolveAll = (obj, keys, config, env) => {
  keys.forEach(key => resolve(obj, key, config, env))
}

const resolveConfig = (config, env) => {
  resolveAll(config, ['baseDir', 'configDir', 'configPrefix', 'cacheDir'], config, env)

  const sources = config.sources || [];
  for (const source of sources) {
    resolveAll(source, ['dir', 'index', 'excludeIfPresent', 'excludeFromFile'], config, env)
  }

  resolveAll(config, ['storage.dir', 'database.file', 'events.file', 'server.key', 'server.cert'], config, env)
  return config
}

module.exports = { resolveConfig, useEnvDefaults }
