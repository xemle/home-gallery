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
        .command(
          ['extractors', 'extractor', 'extract'],
          'List extractor tasks',
          (yargs) => yargs
            .options({
            }),
          (argv) => {
            const run = async () => {
              const options = await loadManagerOptions(argv)
              const { createExtractorStreams } = await import('@home-gallery/plugin')

              // Initiate the extractors and tear them down
              return createExtractorStreams(options.config)
                .then(([streams, tearDown]) => tearDown().then(() => streams))
            }

            const t0 = Date.now();
            return run()
              .then((streams) => {
                log.debug(t0, `Found ${streams.length} extractor tasks`)
                const phases = [
                  {phase: 'meta', extractors: streams.filter(e => e.extractor.phase == 'meta')},
                  {phase: 'raw', extractors: streams.filter(e => e.extractor.phase == 'raw')},
                  {phase: 'file', extractors: streams.filter(e => !['meta', 'raw'].includes(e.extractor.phase))},
                ]

                console.log(`List Extractor Tasks (${streams.length}):`)
                for (let phase of phases) {
                  console.log(`\nExtractor phase ${phase.phase} (${phase.extractors.length}):`)
                  phase.extractors.forEach(extractor => {
                    console.log(`- ${extractor.extractor.name} (plugin ${extractor.plugin.name})`)
                  })
                }
              })
              .catch(err => {
                log.error(err, `List of extractor plugins failed: ${err}`);
                process.exit(1)
              })
          }
        )
        .command(
          ['database'],
          'List database mappers',
          (yargs) => yargs
            .options({
            }),
          (argv) => {
            const run = async () => {
              const options = await loadManagerOptions(argv)
              const { createDatabaseMapperStream } = await import('@home-gallery/plugin')

              return createDatabaseMapperStream(options.config)
            }

            const t0 = Date.now();
            return run()
              .then((stream) => {
                log.debug(t0, `Found ${stream.entries.length} database mappers`)
                console.log(`List Database Mappers (${stream.entries.length}):`)
                stream.entries.forEach(mapperEntry => {
                  const order = mapperEntry.databaseMapper.order || 1
                  console.log(`- ${mapperEntry.databaseMapper.name} (plugin ${mapperEntry.plugin.name}${order != 1 ? ', order ' + order : ''})`)
                })
              })
              .catch(err => {
                log.error(err, `List of extractor plugins failed: ${err}`);
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
  const disabledExtractors = config.pluginManager?.disabledExtractors || []
  const disabledDatabaseMappers = config.pluginManager?.disabledDatabaseMappers || []
  const disabledQueryPlugins = config.pluginManager?.disabledQueryPlugins || []

  const plugins = manager.getPlugins()
  console.log(`Plugins: ${plugins.length} available`)
  plugins.forEach(plugin => {
    console.log(`\n- ${plugin.name} v${plugin.version}:`)
    if (plugin.requires?.length) {
      console.log(`  Requires:`)
      plugin.requires.forEach(dependency => {
        console.log(`  - ${dependency}`)
      })
    }
    const factory = manager.getModuleFactoryFor(plugin.name)

    const extractors = factory?.getExtractors?.()
    if (extractors?.length) {
      console.log(`  Extractors${extractors.length > 1 ? '(' + extractors.length + ')' : ''}:`)
      extractors.forEach(extractor => {
        const phase = extractor.phase != 'file' ? ', phase ' + extractor.phase : ''
        const disabled = disabledExtractors.includes(extractor.name) ? ' (disabled)' : ''
        console.log(`  - ${extractor.name}${phase}${disabled}`)
      })
    }

    const mappers = factory?.getDatabaseMappers?.()
    if (mappers?.length) {
      console.log(`  Database mappers${mappers.length > 1 ? '(' + mappers.length + ')' : ''}:`)
      mappers.forEach(mapper => {
        const order = typeof mapper.order != 'undefined' ? mapper.order : 1
        const disabled = disabledDatabaseMappers.includes(mapper.name) ? ' (disabled)' : ''
        console.log(`  - ${mapper.name}${order != 1 ? ', order ' + order : ''}${disabled}`)
      })
    }

    const queryPlugins = factory?.getQueryPlugins?.()
    if (queryPlugins?.length) {
      console.log(`  Query plugins${queryPlugins.length > 1 ? '(' + queryPlugins.length + ')' : ''}:`)
      queryPlugins.forEach(query => {
        const order = typeof query.order != 'undefined' ? query.order : 1
        const disabled = disabledQueryPlugins.includes(query.name) ? ' (disabled)' : ''
        console.log(`  - ${query.name}${order != 1 ? ', order ' + order : ''}${disabled}`)
      })
    }
  })
}

/**
 * @param {import('@home-gallery/types').TGalleryPluginManager} manager
 */
const listPluginsJson = manager => {
  const plugins = manager.getPlugins()
  const data = plugins.map(plugin => {
    const factory = manager.getModuleFactoryFor(plugin.name)
    const extractors = factory?.getExtractors?.() || []
    const databaseMappers = factory?.getDatabaseMappers?.() || []
    const queryPlugins = factory?.getQueryPlugins?.() || []
    const pluginData = {
      name: plugin,
      version: plugin.version,
      requires: plugin.requires || [],
      extractors: extractors.map(extractor => {
        return {
          name: extractor.name,
          phase: extractor.phase
        }
      }),
      databaseMappers: databaseMappers.map(mapper => {
        const order = typeof mapper.order == 'number' ? mapper.order : 1
        return {
          name: mapper.name,
          order
        }
      }),
      queryPlugins: queryPlugins.map(query => {
        const order = typeof query.order == 'number' ? query.order : 1
        return {
          name: query.name,
          order
        }
      })
    }

    return pluginData
  })

  console.log(JSON.stringify(data))
}

export default command;
