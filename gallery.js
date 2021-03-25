#!/usr/bin/env node

const fs = require('fs/promises');
const fsPath = require('path');
const { spawn } = require('child_process');
const { Select, MultiSelect } = require('enquirer');
const YAML = require('yaml');

const run = async (command, args, options) => {
  const defaults = { shell: true, stdio: 'inherit'}
  const optionsEnv = (options || {}).env || {}
  const optionsEnvList = Object.keys(optionsEnv).map(name => `${name}=${optionsEnv[name]}`)

  return new Promise((resolve, reject) => {
    console.log(`Execute: ${optionsEnvList.length ? `${optionsEnvList.join(' ')} ` : ''}${[command, ...args].join(' ')}`)
    const env = {...process.env, ...optionsEnv};
    const cmd = spawn(command, args, {...defaults, ...options, env});
    cmd.on('exit', (code, signal) => code == 0 ? resolve(code, signal) : reject(code, signal));
    cmd.on('err', reject)
  })
}

const runCli = async(args, options) => run('node', ['cli.js', ...args], options)

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

const extract = async (config, sources, checksumFrom) => {
  const args = ['extract'];
  const extractor = config.extractor || {};
  sources.forEach(source => args.push('--index', source.index));

  args.push('--storage', config.storage.dir)
  extractor.apiServer && args.push('--api-server', extractor.apiServer)

  const excludes = extractor.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  checksumFrom && args.push('--checksum-from', checksumFrom)

  await runCli(args, {env: {DEBUG: '*'}})
}

const databaseBuild = async (config) => {
  const args = ['build'];
  const storage = config.storage || {}
  config.sources.forEach(source => args.push('-i', source.index));
  args.push('--storage', storage.dir, '--database', config.database.file);

  const excludes = storage.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  await runCli(args, {env: {DEBUG: '*'}})
}

const systemUpgrade = async () => {
  await runSimple('git pull')
  await runSimple('npm install')
  await runSimple('npm run bootstrap -- --ignore "@home-gallery/api-server"')
  await runSimple('npm run clean -- --ignore "@home-gallery/api-server"')
  await runSimple('npm run build -- --ignore "@home-gallery/api-server"')
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
        const dirs = await runner(menu.selectSources, config)
        sources = sources.filter(source => dirs.indexOf(source.dir) >= 0)
      }

      const now = new Date().toISOString().substring(0, 16);
      await updateIndices(sources);
      await extract(config, sources, command == 'increment' ? now : false);
      await databaseBuild(config);

      return 'main'
    }
  },
  selectSources: {
    prompt: config => new MultiSelect({
      message: 'Select source directories to update',
      footer: '(use space to select, enter to confirm)',
      initial: config.sources.filter(source => !source.offline).map(source => source.dir),
      choices: config.sources.map((source, i) => {
        return { value: source.dir, message: `${i + 1}. Source dir: ${source.dir}`, disabled: source.offline, hint: `${source.offline ? '(offline)' : ''}`}
      })
    }).run(),
    action: async (dirs, config) => {
      if (!dirs.length) {
        console.log(`No source directories selected. Continue with all ${config.sources.length} sources`);
        return config.sources.filter(source => !source.offline).map(source => source.dir)
      }
      return dirs;
    }
  },
  system: {
    prompt: () => new Select({
      message: 'System options',
      choices: [
        {name: 'appUpgrade', message: 'Upgrade gallery application', hint: '(requires git)'},
        {name: 'showConfig', message: 'Show expanded configuration'},
        {name: 'main', message: 'Back'}
      ]
    }).run(),
    action: async (command, config) => {
      if (command === 'appUpgrade') {
        await systemUpgrade(config);
        return 'system'
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

const expandConfigDefaults = (config) => {
  Object.assign(config, {...{
    baseDir: '~',
    confDir: '{baseDir}/.config/home-gallery',
    confPrefix: '',
    cacheDir: '{baseDir}/.cache/home-gallery'
  }, ...config});

  if (config.sources && config.sources.length) {
    for (const i in config.sources) {
      const source = config.sources[i];
      config.sources[i] = Object.assign({
        index: '{confDir}/{confPrefix}{basename(dir)}.idx',
        offline: false,
        excludeIfPresent: '.galleryignore'
      }, source)
    }
  }

  config.storage = Object.assign({
    dir: '{cacheDir}/storage'
  }, config.storage);

  config.database = Object.assign({
    file: '{confDir}/{confPrefix}database.db'
  }, config.database);

  config.events = Object.assign({
    file: '{confDir}/{confPrefix}events.db'
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

const resolveEnv = (env, path) => {
  const name = 'GALLERY_' + path.replace(/([A-Z])/g, c => `_${c}`).toUpperCase().replace(/\./g, '_')
  return env[name] ? [env, name] : [env, false]
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

const resolveConfig = (config, file) => {
  const env = {...process.env, ...{
    HOME: process.env['HOME'] || process.env['HOMEPATH'],
    CWD: fsPath.resolve(fsPath.dirname(file))
  } }
  resolveAll(config, ['baseDir', 'confDir', 'confPrefix', 'cacheDir'], config, env)

  const sources = config.sources || [];
  for (const source of sources) {
    resolveAll(source, ['dir', 'index', 'excludeIfPresent', 'excludeFromFile'], config, env)
  }

  resolveAll(config, ['storage.dir', 'database.file', 'events.file', 'server.key', 'server.cert'], config, env)
  return config
}

const assertError = (message, ...args) => { throw new Error(message, ...args) };

const validateConfig = async config => {
  (config.sources && config.sources.length) || assertError(`Media source directories are missing`);

  for (const i in config.sources) {
    const source = config.sources[i];
    const isDir = await fs.access(source.dir).then(() => fs.stat(source.dir)).catch(() => false);
    isDir || assertError(`Source directory ${source.dir} does not exists`)
  }
  const uniqIndexFiles = config.sources.map(source => source.index).filter((v, i, a) => a.indexOf(v) === i);
  (uniqIndexFiles.length == config.sources.length) || assertError(`Source index files are not unique`);
}

const useExampleFallback = async (file, err) => {
  const example = 'gallery.config-example.yml'
  return fs.access(example)
    .then(() => {
      console.log(`Use fallback configuration ${example}`)
      return fs.readFile(example, 'utf8')
    }, () => Promise.reject(new Error(`Could not read configuration file '${file}': ${err}`)))
}

const loadConfig = async file => {
  const data = await fs.readFile(file, 'utf8').catch(e => useExampleFallback(file, e))
  const isYaml = file.match(/\.ya?ml$/i);
  const config = isYaml ? YAML.parse(data) : JSON.parse(file)
  expandConfigDefaults(config)
  resolveConfig(config, file)
  await validateConfig(config)
    .catch(e => {
      console.log(`Check your expanded configuration file:`)
      console.log(YAML.stringify(config))
      throw e
    })
  console.log(`Loaded gallery configuration from ${file}`)
  return config;
}

const parseArgs = (args, env) => {
  const options = {
    configFile: env['GALLERY_CONFIG'] || 'gallery.config.yml'
  }

  while (args.length) {
    const arg = args.shift();
    if (arg == '-c' || arg == '--config' && args.length) {
      options.configFile = args.shift();
    }
  }
  return options;
}

const options = parseArgs(process.argv.slice(2), process.env)
loadConfig(options.configFile)
  .then(config => runner(menu.main, config))
  .then(result => console.log(result === 'exit' ? 'Have a good day...' : `Result: ${result}`))
  .catch(err => console.log(`Error: ${err}`))
