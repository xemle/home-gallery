#!/usr/bin/env node

const fs = require('fs/promises');
const fsPath = require('path');
const { spawn } = require('child_process');
const { Select, MultiSelect } = require('enquirer');
const YAML = require('yaml');

const nodeBin = process.argv[0]
const galleryDir = __dirname
const cliScript = fsPath.join(galleryDir, 'cli.js')

const run = async (command, args, options) => {
  const defaults = { shell: false, stdio: 'inherit'}
  const optionsEnv = (options || {}).env || {}
  const optionsEnvList = Object.keys(optionsEnv).map(name => `${name}=${optionsEnv[name]}`)

  return new Promise((resolve, reject) => {
    console.log(`Execute: ${optionsEnvList.length ? `${optionsEnvList.join(' ')} ` : ''}${[command, ...args].map(v => / /.test(v) ? `"${v}"` : v).join(' ')}`)
    const env = {...process.env, ...optionsEnv};
    const cmd = spawn(command, args, {...defaults, ...options, env});
    cmd.on('exit', (code, signal) => code == 0 ? resolve(code, signal) : reject(code, signal));
    cmd.on('err', reject)
  })
}

const runCli = async(args, options, nodeArgs) => run(nodeBin, [...(nodeArgs || []), cliScript, ...args], options)

const runSimple = async (commandLine, options) => {
  const args = commandLine.split(' ');
  const command = args.shift();
  return run(command, args, options)
}

const runner = (item, config, ...args) => item.prompt(config)
    .then(result => item.action ? item.action(result, config, ...args) : result)
    .then(result => {
      if (menu[result]) {
        return runner(menu[result], config, ...args);
      } else {
        return result;
      }
    })

const startServer = async config => {
  const server = config.server || {};

  const args = ['server',
    '--storage', config.storage.dir,
    '--database', config.database.file,
    '--events', config.events.file,
  ];
  server.host && args.push('--host', server.host)
  server.port && args.push('--port', server.port)
  server.key && server.cert && args.push('--key', server.key, '--cert', server.cert)

  await runCli(args, { env: {DEBUG: 'server*' } })
  return 'exit'
}

const updateIndex = async source => {
  const args = ['index', '--directory', source.dir, '--index', source.index, '--checksum']
  source.matcher && args.push('--matcher', source.matcher)
  source.excludeFromFile && args.push('--exclude-from-file', source.excludeFromFile)
  source.excludeIfPresent && args.push('--exclude-if-present', source.excludeIfPresent)

  excludes = source.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  await runCli(args, {env: {DEBUG: '*'}})
}

const updateIndices = async sources => {
  for (const source of sources) {
    await updateIndex(source);
  }
}

const extract = async (config, sources, options) => {
  if (!sources.length) {
    console.log(`Warn: Sources list is empty. No files to extract`);
    return;
  }
  const args = ['extract'];
  const extractor = config.extractor || {};
  sources.forEach(source => args.push('--index', source.index));

  args.push('--storage', config.storage.dir)
  extractor.apiServer && args.push('--api-server', extractor.apiServer)

  const excludes = extractor.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  options.checksumFrom && args.push('--checksum-from', options.checksumFrom)

  if (options.concurrent) {
    args.push('--concurrent', options.concurrent)
    args.push('--skip', options.skip || 0)
    args.push('--limit', options.limit || 0)
  }

  await runCli(args, {env: {DEBUG: '*'}})
}

const databaseBuild = async (config) => {
  const args = ['build'];
  const storage = config.storage || {}
  config.sources.forEach(source => args.push('-i', source.index));
  args.push('--storage', storage.dir, '--database', config.database.file);

  const excludes = storage.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  await runCli(args, {env: {DEBUG: '*'}}, ['--max-old-space-size=4096'])
}

const getMainScript = async () => {
  const json = await fs.readFile(fsPath.join(galleryDir, 'package.json'), 'utf8')
  try {
    const data = JSON.parse(json)
    const main = data && data.main || 'gallery.js'
    return fsPath.join(galleryDir, main)
  } catch (e) {
    return Promise.reject(e)
  }
}

const systemUpgrade = async () => {
  await runSimple('git pull', {pwd: galleryDir})
  await runSimple('npm install', {pwd: galleryDir})
  await runSimple('npm run clean -- --ignore "@home-gallery/{api-server,styleguide}"', {pwd: galleryDir})
  await runSimple('npm run build -- --ignore "@home-gallery/{api-server,styleguide}"', {pwd: galleryDir})
  console.log('Gallery application was updated successfully. Start updated CLI...')
  const main = await getMainScript()
  await run(nodeBin, [main])
  return 'exitSilent'
}

const menu = {
  main: {
    prompt: () => new Select({
      message: 'Gallery main menu',
      choices: [
        {name: 'server', message: 'Start server'},
        {name: 'update', message: 'Update and process source files'},
        {name: 'system', message: 'System'},
        {name: 'exit', message: 'Exit'}
      ]
    }).run(),
    action: async (command, config) => {
      if (command === 'server') {
        return startServer(config);
      } else if (command === 'appUpgrade') {
        return systemUpgrade(config);
      } else if (command === 'showConfig') {
        console.log('gallery.config.json:')
        console.log(JSON.stringify(config, null, 2))
        return 'main';
      }
      return command;
    }
  },
  update: {
    prompt: () => new Select({
      message: 'Update files',
      choices: [
        {name: 'increment', message: 'Update and process only new files'},
        {name: 'full', message: 'Process all files'},
        {name: 'main', message: 'Back'}
      ]
    }).run(),
    action: async (command, config) => {
      if (command == 'main') {
        return command;
      }
      let sources = config.sources.filter(source => !source.offline)
      if (sources.length > 1) {
        const indices = await runner(menu.selectSources, config)
        sources = sources.filter(source => indices.indexOf(source.index) >= 0)
      }

      const now = new Date().toISOString().substring(0, 16);
      await updateIndices(sources);
      await extract(config, sources, {
        checksumFrom: command == 'increment' ? now : false
      });
      await databaseBuild(config);

      return 'main'
    }
  },
  selectSources: {
    prompt: config => new MultiSelect({
      message: 'Select source directories to update',
      footer: '(use space to select, enter to confirm)',
      initial: config.sources.filter(source => !source.offline).map(source => source.index),
      choices: config.sources.map((source, i) => {
        return { value: source.index, message: `${i + 1}. Source dir: ${source.dir} (${fsPath.basename(source.index)})`, disabled: source.offline, hint: `${source.offline ? '(offline)' : ''}`}
      })
    }).run(),
    action: async (indices, config) => {
      if (!indices.length) {
        console.log(`No source directories selected. Continue with all ${config.sources.length} sources`);
        return config.sources.filter(source => !source.offline).map(source => source.index)
      }
      return indices;
    }
  },
  system: {
    prompt: () => new Select({
      message: 'System options',
      choices: [
        {name: 'appUpgrade', message: 'Upgrade gallery application', hint: '(requires git)'},
        {name: 'showConfig', message: 'Show expanded configuration'},
        {name: 'debugExtractor', message: 'Debug extractor'},
        {name: 'main', message: 'Back'}
      ]
    }).run(),
    action: async (command, config) => {
      if (command === 'appUpgrade') {
        return await systemUpgrade(config);
      } else if (command === 'debugExtractor') {
        let sources = config.sources.filter(source => !source.offline)
        if (sources.length > 1) {
          const indices = await runner(menu.selectSources, config)
          sources = sources.filter(source => indices.indexOf(source.index) >= 0)
        }
        console.log('Debugging extractor: Adjust concurrent, skip and limit parameter to your need. Add --print-entry parameter to fine tune')
        await extract(config, sources, {
          concurrent: 1,
          skip: 0,
          limit: 0
        });
      } else if (command === 'showConfig') {
        console.log('gallery.config.yml:')
        console.log(YAML.stringify(config, null, 2))
        return 'system'
      } else {
        return 'main'
      }
    }
  }
}

const useEnvDefaults = (config, env) => {
  Object.entries(config).forEach(([key, value]) => {
    config[key] = envDefault(env, key, value)
  })
}

const expandConfigDefaults = (config, env) => {
  const defaultVars = {
    baseDir: '~',
    configDir: '{baseDir}/.config/home-gallery',
    configPrefix: '',
    cacheDir: '{baseDir}/.cache/home-gallery'
  }
  useEnvDefaults(defaultVars, env)
  Object.assign(config, {...defaultVars, ...config});

  if (config.sources && config.sources.length) {
    for (const i in config.sources) {
      const source = config.sources[i];
      config.sources[i] = Object.assign({
        index: '{configDir}/{configPrefix}{basename(dir)}.idx',
        offline: false,
        excludeIfPresent: '.galleryignore'
      }, source)
    }
  }

  config.storage = Object.assign({
    dir: '{cacheDir}/storage'
  }, config.storage);

  config.database = Object.assign({
    file: '{configDir}/{configPrefix}database.db'
  }, config.database);

  config.events = Object.assign({
    file: '{configDir}/{configPrefix}events.db'
  }, config.events);

  return config;
}

const resolvePath = (obj, path) => {
  const parts = path.split('.');
  let parent = obj;
  let key = false;
  while (parts.length && typeof obj[parts[0]] != 'undefined') {
    key = parts.shift();
    parent = obj;
    obj = parent[key];
  }
  if (parts.length) {
    return [parent, false]
  }
  return [parent, key];
}

const envName = path => 'GALLERY_' + path.replace(/([A-Z])/g, c => `_${c}`).toUpperCase().replace(/[^_A-Z]/g, '_')

const resolveEnv = (env, path) => {
  const name = envName(path)
  return env[name] ? [env, name] : [env, false]
}

const envDefault = (env, path, defaultValue) => {
  const name = envName(path)
  return env[name] ? env[name] : defaultValue
}

const resolveEnvOrPath = (env, obj, path) => {
  const [p, k] = resolveEnv(env, path)
  return k ? [p, k] : resolvePath(obj, path)
}

const resolve = (obj, path, config, env) => {
  const [parent, key] = resolveEnvOrPath(env, obj, path);
  if (!key || typeof parent[key] !== 'string') {
    return;
  }

  parent[key] = parent[key]
    // resolve ~ to users home
    .replace(/^~/, env.HOME)
    .replace(/^\.([\\/]|$)/, (_, s) => `${env.CWD}${s}`)
    // resolve function currently only '{basename(dir)}'
    .replace(/\{\s*([^}]+)\(([^)]+)\)\s*\}/g, (_, fn, name) => {
      const [p, k] = resolveEnvOrPath(env, {...config, ...obj}, name)
      return k && fn === 'basename' ? fsPath.basename(p[k]) : ''
    })
    // resolve variable eg. '{baseDir}'
    .replace(/\{\s*([^}]+)\s*\}/g, (_, name) => {
      const [p, k] = resolveEnvOrPath(env, {...config, ...obj}, name);
      return key ? p[k] : '';
    })
}

const resolveAll = (obj, paths, config, env) => {
  paths.forEach(path => resolve(obj, path, config, env))
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

const assertError = (message, ...args) => { throw new Error(message, ...args) };

const validateSources = async sources => {
  if (!sources || !sources.length) {
    console.log(`Warn: Sources list is empty`)
    return
  }

  const onlineSources = sources.filter(source => !source.offline)
  for (const i in onlineSources) {
    const source = onlineSources[i];
    const dirStat = await fs.stat(source.dir).catch(() => false);
    dirStat || assertError(`Source directory '${source.dir}' does not exists and is required for an online source.`)
    dirStat.isDirectory() || assertError(`Source directory '${source.dir}' is not a directory`)
  }

  const offlineSources = sources.filter(source => source.offline)
  for (const i in offlineSources) {
    const source = offlineSources[i];
    const fileStat = await fs.stat(source.index).catch(() => false);
    fileStat || assertError(`Index file ${source.index} of offline source directory '${source.dir}' does not exists. Offline sources require an index file and you should process a source first before it can be marked offline`)
    fileStat.isFile() || assertError(`Index file ${source.index} of offline source directory '${source.dir}' is not a file`)
  }

  const uniqIndexFiles = sources.map(source => source.index).filter((v, i, a) => a.indexOf(v) === i);
  (uniqIndexFiles.length == sources.length) || assertError(`Source index files are not unique`);
}

const validateConfig = async config => {
  await validateSources(config.sources)
}

const initExampleConfig = async (options, err) => {
  const example = fsPath.join(galleryDir, 'gallery.config-example.yml')
  return fs.access(example)
    .then(() => {
      console.log(`Init configuration from ${example}`)
      return fs.copyFile(example, 'gallery.config.yml')
    }).then(() => {
      options.configFile = 'gallery.config.yml'
      return fs.readFile(options.configFile, 'utf8')
    }, () => Promise.reject(new Error(`Could not read configuration file '${options.configFile}': ${err}`)))
}

const loadConfig = async options => {
  const isYaml = options.configFile.match(/\.ya?ml$/i);
  const isJson = options.configFile.match(/\.json$/i);
  if (!isYaml && !isJson) {
    throw new Error(`Unknown file extension of '${options.configFile}'. Expect a .yaml or .json file`)
  }

  const data = await fs.readFile(options.configFile, 'utf8').catch(e => initExampleConfig(options, e))
  const config = isYaml ? YAML.parse(data) : JSON.parse(data)
  const env = {...process.env, ...{
    HOME: process.env['HOME'] || process.env['HOMEPATH'],
    CWD: fsPath.resolve(fsPath.dirname(options.configFile))
  } }

  expandConfigDefaults(config, env)
  resolveConfig(config, env)
  await validateConfig(config)
    .catch(e => {
      console.log(`Check your expanded configuration file:`)
      console.log(YAML.stringify(config))
      throw e
    })
  console.log(`Loaded gallery configuration from ${options.configFile}`)
  options.config = config;
  return options;
}

const parseArgs = (args, env) => {
  const options = {
    configFile: envDefault(env, 'config', 'gallery.config.yml')
  }

  while (args.length) {
    const arg = args.shift();
    if (arg == '-c' || arg == '--config' && args.length) {
      options.configFile = args.shift();
    }
  }
  return options;
}

// exit if this file is only required
if (require.main !== module) {
  return;
}
const options = parseArgs(process.argv.slice(2), process.env)
loadConfig(options)
  .then(options => runner(menu.main, options.config))
  .then(result => result == 'exit' && console.log('Have a good day...'))
  .catch(err => console.log(`Error: ${err}`))
