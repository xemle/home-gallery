import * as fs from 'fs'

import { IWalkerFileHandler } from "../types.js"

export function createFilterChain(filters: IWalkerFileHandler[]): IWalkerFileHandler {
  if (!filters.length) {
    return () => true
  }

  return (filename: string, stat: fs.Stats) => {
    for (let i = 0; i < filters.length; i++) {
      if (!filters[i](filename, stat)) {
        return false
      }
    }
    return true
  }
}
