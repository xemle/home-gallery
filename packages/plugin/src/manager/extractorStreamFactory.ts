import { Transform } from "stream";

import { TExtractorEntry, TExtractorFunction, TExtractor, TExtractorStream, TExtractorTask, TPlugin, TPluginManager, TStorage, TExtractorStreamTearDown } from "@home-gallery/types";
import { through } from "@home-gallery/stream";
import Logger from "@home-gallery/logger";

import { TPluginContext } from "./types";

const log = Logger('plugin.extractorStreamFactory')

export class ExtractorStreamFactory {
  manager: TPluginManager
  storage: TStorage
  plugins: TPluginContext[]

  constructor(manager: TPluginManager, storage: TStorage, plugins: TPluginContext[]) {
    this.manager = manager
    this.storage = storage
    this.plugins = plugins
  }

  #functionToStream(task: TExtractorFunction, extractor: TExtractor) {
    return through(function transform(entry: TExtractorEntry, _: any, cb: (err?: any, result?: any) => void) {
      Promise.resolve(task(entry))
        .then(() => cb(null, entry))
        .catch((err: any) => {
          cb(new Error(`Extractor function task ${extractor.name} for phase ${extractor.phase} failed `, {cause: err}))
        })
    })
  }

  #testAndTaskToStream(task: TExtractorTask, plugin: TExtractor) {
    const test = task.test ? task.test : () => true
    const end = task.end ? task.end : () => Promise.resolve()

    return through(function transform(entry: TExtractorEntry, _: any, cb: (err?: any, result?: any) => void) {
      if (!test(entry)) {
        return cb(null, entry)
      }

      task.task(entry)
        .then(() => cb(null, entry))
        .catch((err: any) => {
          cb(new Error(`Extractor task ${plugin.name} for phase ${plugin.phase} failed`, {cause: err}))
        })
    }, function flush(cb: () => void) {
      end().then(cb, cb)
    })
  }

  async getExtractorStreamsFrom(plugin: TPlugin, extractors: TExtractor[]): Promise<TExtractorStream[]> {
    if (!extractors?.length) {
      return []
    }

    const config = this.manager.getConfig()
    const streams: TExtractorStream[] = []
    for (let extractor of extractors) {
      await extractor.create(this.storage)
        .then(task => {
          if (task instanceof Transform) {
            const logError = (err: any) => log.warn(err, `Extractor transform task ${extractor.name} for phase ${extractor.phase} failed`)
            streams.push({stream: task.on('error', logError), extractor, plugin})
          } else if (typeof task == 'function') {
            streams.push({stream: this.#functionToStream(task, extractor), extractor, plugin})
          } else if (typeof task.task == 'function') {
            streams.push({stream: this.#testAndTaskToStream(task, extractor), extractor, plugin})
          } else {
            throw new Error(`Invalid task. Expected Transform, function or object with task function`)
          }
        }).catch(err => {
          log.warn(err, `Failed to create extractor task of ${extractor.name} for phase ${extractor.phase}: ${err}. Skip it`)
        })
    }

    return streams
  }

  async getExtractorStreams(): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
    const disabledExtractors = this.manager.getConfig().pluginManager?.disabledExtractors || []

    const t0 = Date.now()
    const streams = [] as TExtractorStream[]

    for (let plugin of this.plugins) {
      if (!plugin.factory?.getExtractors) {
        continue
      }
      const extractors = plugin.factory.getExtractors()
        .filter(extractor => {
          if (!disabledExtractors.includes(extractor.name)) {
            return true
          }
          log.info(`Disable extractor ${extractor.name} from ${plugin.plugin.name}`)
          return false
        })
      const pluginStreams = await this.getExtractorStreamsFrom(plugin.plugin, extractors)
      streams.push(...pluginStreams)
    }
    log.debug(t0, `Loaded ${streams.length} extractor tasks from ${this.plugins.length} plugins`)

    const tearDown = async () => {
      const tearDownExtractors = streams
        .filter(stream => stream.extractor?.tearDown)
        .map(stream => stream.extractor)
        .reverse()

      if (!tearDownExtractors.length) {
        return
      }

      const t0 = Date.now()
      for (let plugin of tearDownExtractors) {
        await plugin.tearDown!()
          .catch(err => log.warn(err, `Failed to tear down plugin ${plugin.name}: ${err}`))
      }
      log.debug(t0, `All ${tearDownExtractors.length} extractors where teared down: ${tearDownExtractors.map(p => p.name).join(', ')}`)
    }

    return [streams, tearDown]
  }
}
