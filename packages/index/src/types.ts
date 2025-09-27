import type { Stats } from 'fs';

export type IIndexEntry = {
  dev: number
  ino: number
  filename: string
  size: number
  ctimeMs: number
  created: string
  sha1sum: string
  sha1sumDate: string | null
  prevSha1sum?: string
  isDirectory: boolean
  isFile: boolean
  isSymbolicLink: boolean
  isOther: boolean
  fileType: string
}

export type IIndexEntryMap = Record<string, IIndexEntry>

export type IIndex = {
  type: string
  created: string
  base: string
  data: IIndexEntry[]
}

export type IIndexChanges = {
  adds: IIndexEntry[]
  changes: IIndexEntry[]
  removes: IIndexEntry[]
}

export type IIndexJournal = {
  type: string
  created: string
  base: string
  indexCreated: string
  data: IIndexChanges
}

export type IIndexOptions = {
  dryRun?: boolean
  checksum?: boolean
  journal?: string,
  keepJournal?: boolean
  matcherFn: IIndexEntryMatcherFn
  filter: IWalkerFileHandler
  addLimits: string
  excludeIfPresent?: string
  maxFilesize?: string
  keepKnownFiles?: boolean
  exclude?: string[]
  excludeFromFile?: string
}

export type IIndexEntryMatcherFn = (one: IIndexEntry, other: IIndexEntry) => boolean

/**
 * @param filename Filename
 * @param stat File stats
 * @returns {boolean} skip file handling. If file is a directory skip file walking
 */
export type IWalkerFileHandler = (filename: string, stat: Stats) => boolean