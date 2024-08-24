import path from 'path'

import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js'

const log = Logger('cli.plugin')

const command = {
  command: 'plugin',
  describe: 'Plugin handling',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
      'auto-config': {
        boolean: true,
        default: true,
        describe: 'Search for configuration on common configuration directories'
      },
    })
    .command(
      ['create'],
      'Create a new plugin',
      (yargs) => yargs
        .options({
          name: {
            alias: 'n',
            required: true,
            describe: 'Plugin name'
          },
          dir: {
            alias: 'd',
            describe: 'Base directory of plugins. The plugin will be created as separate directory of given plugin name below'
          },
          sourceType: {
            alias: 't',
            describe: 'Source language type',
            default: 'vanilla',
            choices: ['single', 'vanilla', 'typescript']
          },
          environment: {
            alias: 'e',
            describe: 'Plugin environments',
            array: true,
            default: 'server',
            choices: ['server', 'browser']
          },
          modules: {
            alias: 'm',
            array: true,
            choices: ['extractor', 'database', 'query'],
            describe: 'Plugin modules. Any set of extractor, database'
          },
          force: {
            alias: 'f',
            boolean: true,
            default: false,
            describe: 'Force plugin folder overwrite if exists'
          },
        }),
      (argv) => {
        const argvMapping = {
          'name': 'createPlugin.name',
          'dir': 'createPlugin.baseDir',
          'modules': 'createPlugin.modules',
          'sourceType': 'createPlugin.sourceType',
          'force': 'createPlugin.force',
          'environment': 'createPlugin.environments',
        }

        const setDefaults = config => {
          if (!config.createPlugin.baseDir) {
            config.createPlugin.baseDir = path.resolve(config.pluginManager?.dirs?.[0] || 'plugins')
            log.trace(`Use plugin baseDir ${config.createPlugin.baseDir}`)
          }
          if (!config.createPlugin.modules?.length) {
            config.createPlugin.modules = ['extractor', 'database', 'query']
          }
        }

        const run = async() => {
          const { createPlugin } = await import('@home-gallery/plugin')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, argvMapping)
          setDefaults(options.config)
          validatePaths(options.config, [])

          return createPlugin(options)
        }

        const t0 = Date.now();
        return run()
          .then((dir) => {
            const cwd = path.resolve()
            const relative = cwd.startsWith(path.resolve(dir)) ? path.relative(cwd, dir) : dir
            log.info(t0, `Created plugin at ${relative}`);
          })
          .catch(err => {
            console.log(`foobar`)
            log.error(err, `Plugin creation failed: ${err}`);
            process.exit(1)
          })

      }
    )
    .command(
      ['list', 'ls', '$0'],
      'List plugins',
      (yargs) => yargs
        .command(
          ['plugins', '$0'],
          'List plugins',
          (yargs) => yargs
            .options({
              long: {
                boolean: true,
                default: false,
                describe: 'Long version'
              },
              json: {
                boolean: true,
                default: false,
                describe: 'Print plugins in JSON format'
              },
            }),
          (argv) => {
            const run = async () => {
              const options = await loadManagerOptions(argv)
              const { createPluginManager } = await import('@home-gallery/plugin')
              return createPluginManager(options.config, { type: 'cliContext', plugin: {} })
            }

            const t0 = Date.now();
            run()
              .then(manager => {
                const plugins = manager.getPlugins()
                log.debug(t0, `Found ${plugins.length} plugins`)

                if (argv.json) {
                  listPluginsJson(manager)
                } else if (argv.long) {
                  listPluginsLong(manager)
                } else {
                  plugins.forEach(plugin => {
                    console.log(`${plugin.name}`)
                  })
                }
              })
              .catch(err => {
                log.error(err, `List of plugin failed: ${err}`);
                process.exit(1)
              })
          }
        )
    )
  }
}

const loadManagerOptions = async(argv) => {
  const { getPluginFiles: getExtractorPluginFiles } = await import('@home-gallery/extractor')
  const { getPluginFiles: getDatabasePluginFiles } = await import('@home-gallery/database')
  const { getPluginFiles: getServerPluginFiles } = await import('@home-gallery/server')

  const options = await load(argv.config, false, argv.autoConfig)

  const extractorPluginFiles = getExtractorPluginFiles()
  const databasePluginFiles = getDatabasePluginFiles()
  const serverPluginFiles = getServerPluginFiles()
  log.info(`Use ${extractorPluginFiles.length} extractor, ${databasePluginFiles.length} database build and ${serverPluginFiles.length} in plugins`)

  const argvMapping = {
  }

  const setDefaults = (config) => {
    config.pluginManager = {
      ...config.pluginManager,
      plugins: [
        ...extractorPluginFiles,
        ...databasePluginFiles,
        ...serverPluginFiles,
        ...(config.pluginManager?.plugins || [])
      ]
    }
  }

  mapArgs(argv, options.config, argvMapping)
  setDefaults(options.config, extractorPluginFiles)
  validatePaths(options.config, [])

  return options
}

/**
 * @param {import('@home-gallery/types').TGalleryPluginManager} manager
 */
const listPluginsLong = manager => {
  const config = manager.getConfig()
  const disabledExtensions = config.pluginManager?.disabled || []

  const plugins = manager.getPlugins()
  const extensions = manager.getExtensions()
  console.log(`Plugins: ${plugins.length} available`)
  plugins.forEach(plugin => {
    console.log(`\n- ${plugin.name} v${plugin.version}:`)
    if (plugin.requires?.length) {
      console.log(`  Requires:`)
      plugin.requires.forEach(dependency => {
        console.log(`  - ${dependency}`)
      })
    }
    const pluginExtensions = extensions.filter(e => e.plugin == plugin)
    if (!pluginExtensions.length) {
      return
    }

    const extractors = pluginExtensions.filter(e => e.type == 'extractor').map(e => e.extension)
    if (extractors?.length) {
      console.log(`  Extractors${extractors.length > 1 ? '(' + extractors.length + ')' : ''}:`)
      extractors.forEach(extractor => {
        const phase = extractor.phase != 'file' ? ', phase ' + extractor.phase : ''
        const disabled = disabledExtensions.includes(`${plugin.name}.${extractor.name}`) ? ' (disabled)' : ''
        console.log(`  - ${plugin.name}.${extractor.name}${phase}${disabled}`)
      })
    }

    const mappers = pluginExtensions.filter(e => e.type == 'database').map(e => e.extension)
    if (mappers?.length) {
      console.log(`  Database mappers${mappers.length > 1 ? '(' + mappers.length + ')' : ''}:`)
      mappers.forEach(mapper => {
        const order = typeof mapper.order != 'undefined' ? mapper.order : 1
        const disabled = disabledExtensions.includes(`${plugin.name}.${mapper.name}`) ? ' (disabled)' : ''
        console.log(`  - ${plugin.name}.${mapper.name}${order != 1 ? ', order ' + order : ''}${disabled}`)
      })
    }

    const queryPlugins = pluginExtensions.filter(e => e.type == 'query').map(e => e.extension)
    if (queryPlugins?.length) {
      console.log(`  Query plugins${queryPlugins.length > 1 ? '(' + queryPlugins.length + ')' : ''}:`)
      queryPlugins.forEach(query => {
        const order = typeof query.order != 'undefined' ? query.order : 1
        const disabled = disabledExtensions.includes(`${plugin.name}.${query.name}`) ? ' (disabled)' : ''
        console.log(`  - ${plugin.name}.${query.name}${order != 1 ? ', order ' + order : ''}${disabled}`)
      })
    }
  })
}

/**
 * @param {import('@home-gallery/types').TGalleryPluginManager} manager
 */
const listPluginsJson = manager => {
  const plugins = manager.getPlugins()
  const extensions = manager.getExtensions()
  const data = plugins.map(plugin => {
    const pluginExtensions = extensions.filter(e => e.plugin == plugin)
    const pluginData = {
      name: plugin,
      version: plugin.version,
      requires: plugin.requires || [],
      extensions: pluginExtensions.map(({type, extension}) => {
        switch (type) {
          case 'extractor': return {
            type,
            name: extension.name,
            phase: extension.phase
          }
          case 'database': return {
            type,
            name: extension.name,
            order: extension.order || 1
          }
          case 'query': return {
            type,
            name: extension.name,
            order: extension.order || 1
          }
          default: return {
            type,
          }
        }
      })
    }

    return pluginData
  })

  console.log(JSON.stringify(data))
}

export default command;
