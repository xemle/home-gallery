export type IIndexEntry = {
  dev: number
  inode: number
  filename: string
  size: number
  created: number
  sha1sum: string
  sha1sumDate: string
  prevSha1sum?: string
  isDirectory: boolean
  isFile: boolean
  isSymbolicLink: boolean
  isOther: boolean
  fileType: string
}

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
}