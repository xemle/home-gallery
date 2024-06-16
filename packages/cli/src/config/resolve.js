import path from 'path'

import { resolveEnv } from './env.js'

const resolveKey = (obj, key) => {
  const parts = key.split('.');
  let parent = obj;
  let prop = false;
  while (parts.length && obj && typeof obj[parts[0]] != 'undefined') {
    prop = parts.shift();
    parent = obj;
    obj = parent[prop];
  }
  if (parts.length) {
    return [parent, false]
  }
  return [parent, prop];
}


const resolveEnvOrKey = (env, obj, key) => {
  const [p, k] = resolveEnv(env, key)
  return k ? [p, k] : resolveKey(obj, key)
}

const resolve = (obj, key, config, baseDir, env) => {
  const [parent, prop] = resolveEnvOrKey(env, obj, key);
  if (!prop || typeof parent[prop] !== 'string') {
    return;
  }

  parent[prop] = parent[prop]
    // resolve ~ to users home
    .replace(/^~/, env.HOME)
    .replace(/^\.([\\/]|$)/, (_, s) => path.join(baseDir, s))
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

export const resolveAll = (obj, keys, config, baseDir, env) => {
  keys.forEach(key => resolve(obj, key, config, baseDir, env))
}
