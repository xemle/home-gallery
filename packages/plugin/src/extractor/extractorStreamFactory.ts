import { Transform } from "stream";

import type { TExtractorEntry, TExtractorFunction, TExtractor, TExtractorStream, TExtractorTask, TPlugin, TPluginManager, TStorage, TExtractorStreamTearDown, TPluginExtension } from "@home-gallery/types";
import { through } from "@home-gallery/stream";
import Logger from "@home-gallery/logger";

const log = Logger('plugin.extractorStreamFactory')

export class ExtractorStreamFactory {
  manager: TPluginManager
  storage: TStorage
  extensions: TPluginExtension[]

  constructor(manager: TPluginManager, storage: TStorage, extensions: TPluginExtension[]) {
    this.manager = manager
    this.storage = storage
    this.extensions = extensions
  }

  #functionToStream(task: TExtractorFunction, extractor: TExtractor) {
    return through(function transform(entry: TExtractorEntry, _: any, cb: (err?: any, result?: any) => void) {
      Promise.resolve(task(entry))
        .then(() => cb(null, entry))
        .catch((err: any) => {
          cb(new Error(`Extractor function task ${extractor.name} for phase ${extractor.phase} failed `, { cause: err }))
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

  async toStream(plugin: TPlugin, extractor: TExtractor) {
    return extractor.create(this.storage)
      .then(task => {
        if (task instanceof Transform) {
          const logError = (err: any) => log.warn(err, `Extractor transform task ${extractor.name} for phase ${extractor.phase} failed`)
          return {stream: task.on('error', logError), extractor, plugin}
        } else if (typeof task == 'function') {
          return {stream: this.#functionToStream(task, extractor), extractor, plugin}
        } else if (typeof task.task == 'function') {
          return {stream: this.#testAndTaskToStream(task, extractor), extractor, plugin}
        } else {
          throw new Error(`Invalid extractor task from ${plugin.name} extractor ${extractor.name}`)
        }
      })
  }

  async getExtractorStreams(): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
    const disabledExtensions = this.manager.getConfig().pluginManager?.disabled || []

    const t0 = Date.now()
    const streams = [] as TExtractorStream[]

    for (let extension of this.extensions) {
      if (extension.type != 'extractor') {
        continue
      }
      const extractor = extension.extension as TExtractor
      const name = `${extension.plugin.name}.${extension.type}.${extractor.name}`
      if (disabledExtensions.includes(extension.plugin.name) || disabledExtensions.includes(name)) {
        log.debug(`Extractor ${extractor.name} from plugin ${extension.plugin.name} is disabled`)
        continue
      }

      await this.toStream(extension.plugin, extractor)
        .then(stream => streams.push(stream))
        .catch(err => {
          log.warn(err, `Failed to create extractor task of ${extractor.name} for phase ${extractor.phase || 'file'}: ${err}. Skip it`)
        })
    }
    log.debug(t0, `Loaded ${streams.length} extractor tasks from plugins`)

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
