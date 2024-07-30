import { Readable, Transform } from 'stream'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'
import { toList, write } from '@home-gallery/stream'
import { TExtractorStream, TExtractorFunction, TExtractor, TPlugin, TDatabaseMapperStream, TDabaseMapperFunction, TDatabaseMapper, TExtractorEntry, TStorageEntry, TQueryPlugin, TQueryAst, TQueryContext, TAst } from '@home-gallery/types'

Logger.addPretty('trace')
const log = Logger('testUtils')

export async function testEntryStream(streams: TExtractorStream[]) {
  let data: TExtractorEntry[] = []

  const entries: Partial<TExtractorEntry>[] = [
    {sha1sum: '1', type: 'image', files: [], meta: {}}, 
    {sha1sum: '2', type: 'video', files: [], meta: {}}
  ]

  const transforms: Transform[] = streams.map(s => s.stream)
  const pipelineStreams = [
    Readable.from(entries),
    ...streams.map(s => s.stream),
    toList(),
    write((result: TExtractorEntry[]) => data = result)
  ]
  await pipeline(pipelineStreams)

  return data
}

export async function testDatabaseMapperStream(stream: TDatabaseMapperStream) {
  let data

  const entries: Partial<TStorageEntry>[] = [
    {sha1sum: '1', type: 'image', files: [], meta: {}}, 
    {sha1sum: '2', type: 'video', files: [], meta: {}}
  ]
  await pipeline(
    Readable.from(entries),
    stream.stream,
    toList(),
    write((result: any) => data = result)
  )

  return data
}

export const createExtractor = (name: string, extractorTask: TExtractorFunction) => {
  return {
    name: `${name}Extractor`,
    phase: 'file',
    async create() {
      log.debug(`Create extractor task of ${this.name}`)
      return extractorTask
    }
  } as TExtractor
}

export const createDatabaseMapper = (name: string, mapEntry: TDabaseMapperFunction) => {
  return {
    name: `${name}Mapper`,
    mapEntry
  } as TDatabaseMapper
}

export const createQueryPlugin = (name: string, cmpKey: string, valueFn: (e: any) => string) => {
  return {
    name,
    queryHandler(ast: TQueryAst, context: TQueryContext, reason: string) {
      if (ast.type == 'cmp' && ast.key == cmpKey && ast.op == '=') {
        ast.filter = (e: any) => valueFn(e) == (ast.value as TAst)?.value
        return true
      }
      return false
    }
  } as TQueryPlugin
}

export type TTestPluginOption = {
  extractor?: TExtractor,
  mapper?: TDatabaseMapper
  query?: TQueryPlugin
}

export const createExtractorPlugin = (name: string, fn: TExtractorFunction) => {
  return createPlugin(name, {extractor: createExtractor(name, fn)})
}

export const createDatabaseMapperPlugin = (name: string, fn: TDabaseMapperFunction) => {
  return createPlugin(name, {mapper: createDatabaseMapper(name, fn)})
}

export const createPlugin = (name: string, option: TTestPluginOption) => {

  const plugin: TPlugin = {
    name: `${name}Plugin`,
    version: '1.0',
    async initialize() {
      log.debug(`Initialize plugin ${this.name}`)
      return {
        getExtractors() {
          return option.extractor ? [option.extractor] : []
        },
        getDatabaseMappers() {
          return option.mapper ? [option.mapper] : []
        },
        getQueryPlugins() {
          return option.query ? [option.query] : []
        }
      }
    }
  }

  return plugin
}