import { createHash } from '@home-gallery/common'

/**
 * The object store is a key value store of the entries which are
 * served for the offline database on the client side.
 *
 * The object count should be balalanced. To many objects leads to many
 * and slow network requests. While to less objects leads to large
 * objects.
 *
 * We build objects by entries date with depth of two. First depth is
 * the year, the second depth is the month. Therefore, the root nodes
 * holds children of years while each sub node has 12 nodes for each
 * month.
 *
 * The granularity of month groups is controlled via
 * createYearGroupedMonthPathMapper() factory
 */
export class ObjectStoreV2 {

  /**
   * Create tree by path of entry's date with year/month
   *
   * Key is the entry hash and value is the stringified JSON to reduce
   * response times
   *
   * Reuse objects for different users to save memory
   */
  map = new Map()

  constructor(pathMapper = yearMonthPathMapper) {
    this.pathMapper = pathMapper
  }

  /**
   * Create tree by path of entry's date with year/month
   *
   * We reuse the fact that the database entries are ordered by date,
   * latest entry first. So we can iterate linar through the entries
   * list and build the tree nodes.
   */
  addEntries(entries, entryFilter = () => true, mapEntry = e => e) {
    const root = new TreeEntry([])
    const nodeStack = [root]
    for (const entry of entries) {
      if (!entryFilter(entry)) {
        continue
      }

      const path = this.pathMapper(entry)
      const node = this._pushNode(nodeStack, path)

      const firstFilename = entry.files[0].filename
      node.addChild({type: 'entry', name: firstFilename, hash: entry.hash, data: mapEntry(entry)})
    }

    return this._popNode(nodeStack)
  }

  getByHash(hash) {
    return this.map.get(hash)
  }

  clear() {
    this.map.clear()
  }

  _pushNode(nodeStack, path) {
    for (let i = 0; i <= path.length; i++) {
      const subPath = path.slice(0, i)
      if (nodeStack[i] && nodeStack[i].isPath(subPath)) {
        continue
      }
      if (!nodeStack[i]) {
        nodeStack[i] = new TreeEntry(subPath)
      } else if (!nodeStack[i].isPath(subPath)) {
        this._popNode(nodeStack, i)
        nodeStack[i] = new TreeEntry(subPath)
      }
    }

    return nodeStack[path.length]
  }

  _popNode(nodeStack, to = 0) {
    let hash
    for (let i = nodeStack.length - 1; i >= to; i--) {
      const node = nodeStack[i]
      nodeStack[i] = false

      let object = node.toObject()
      this._addObject(object)
      if (i > 0) {
        nodeStack[i - 1].addChild({type: 'tree', name: node.path.join('/'), hash: object.hash})
      }
      hash = object.hash
    }
    return hash
  }

  _addObject(object) {
    if (this.map.has(object.hash)) {
      return
    }
    this.map.set(object.hash, JSON.stringify(object))
  }
}

export function yearMonthPathMapper(entry) {
  const year = entry.date.substring(0, 4)
  const month = entry.date.substring(5, 7)
  return [year, month]
}

/**
 * Group month in ceiled group month values for older years
 *
 * eg. for monthGroupSize = 3: 01 -> 03, 02 -> 03, 03 -> 03, 04 -> 06, ...
 *
 * Do not group month if year is within the given recent ignored
 * year count since we expect frequent entry changes in the recent
 * year but not the the past years.
 *
 * For recent years the updates more granular than in the past.
 *
 * So we can group the years of the past to reduce the total object
 * count and to speed up initial load by less requests
 */
export function createYearGroupedMonthPathMapper(monthGroupSize = 3, irgnoreRecentYears = 4) {
  const ignoreYearFrom = '' + (new Date().getFullYear() - irgnoreRecentYears)

  const groupedMonthMapper = function (year, entry) {
    let month = +entry.date.substring(5, 7)
    const monthGroup = '' + (month + (monthGroupSize - (month % monthGroupSize)) % monthGroupSize)
    return [year, monthGroup.padStart(2, '0')]
  }

  return function(entry) {
    const year = entry.date.substring(0, 4)
    if (year > ignoreYearFrom) {
      return yearMonthPathMapper(entry)
    }
    return groupedMonthMapper(year, entry)
  }
}

class TreeEntry {
  path
  data = []

  constructor(path) {
    this.path = path
  }

  isPath(path) {
    if (this.path.length != path.length) {
      return
    }

    for (let i = 0; i < this.path.length; i++) {
      if (this.path[i] != path[i]) {
        return false
      }
    }

    return true
  }

  addChild(child) {
    this.data.push(child)
  }

  toObject() {
    const hashData = this.data.map(child => `${child.type} ${child.hash}  ${child.name}`).join('\n')
    return {
      type: 'home-gallery/database-tree@2.0',
      hash: createHash(hashData),
      data: this.data
    }
  }
}
