const envName = key => 'GALLERY_' + key.replace(/([A-Z])/g, c => `_${c}`).toUpperCase().replace(/[^_A-Z]/g, '_')

export const resolveEnv = (env, key) => {
  const name = envName(key)
  return env[name] ? [env, name] : [env, false]
}

const envDefault = (env, key, defaultValue) => {
  const name = envName(key)
  return env[name] ? env[name] : defaultValue
}

export const useEnvDefaults = (config, env) => {
  Object.entries(config).forEach(([key, value]) => {
    config[key] = envDefault(env, key, value)
  })
}
