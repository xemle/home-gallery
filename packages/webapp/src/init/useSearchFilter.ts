import { useEffect } from 'react'
import { useLogger, usePluginManager } from '../AppContext'
import { useEntryStore } from '../store/entry-store'
import { TQueryContext } from '@home-gallery/types'
import { stringifyEntry } from '@home-gallery/query'
import { useSearchStore } from '../store/search-store'
import { findAllEntriesByIdPrefix } from '../utils/findAllEntriesByIdPrefix'
import { Entry } from '../store/entry'

/**
 * Bind entry store and search store with plugin manager and its executeQuery()
 */
export const useSearchFilter = () => {
  const allEntries = useEntryStore(state => state.allEntries)
  const setEntries = useEntryStore(state => state.setEntries)
  const query = useSearchStore(state => state.query)
  const manager = usePluginManager()
  const log = useLogger('SearchFilter')

  useEffect(() => {
    const databaseApi = createDatabaseApi(allEntries)

    run(databaseApi, query, manager, log)
      .then(entries => setEntries(entries))
  }, [allEntries, query])

}

const run = async (databaseApi, query, manager, log) => {
  const queryContext: TQueryContext = createQueryContext(databaseApi, log)

  let term = ''
  switch (query.type) {
    case 'none': term = ''; break
    case 'query': term = query.value || ''; ; break
    case 'year': term = query.query || ''; queryContext.plugin.year = { value: query.value }; break
    case 'similar': term = query.query || ''; queryContext.plugin.similar = { seedId: query.value }; break
    default:
      log.warn(`Search type ${query.type} NYI`)
      break
  }

  return manager.executeQuery(databaseApi.entries.findAll(), term, queryContext)
}

function createQueryContext(databaseApi, log): TQueryContext {
  return {
    textFn(entry) {
      return stringifyEntry(entry)
    },
    queryErrorHandler(ast, context, reason) {
      log.warn(ast, `Unhandled query ast ${ast.type}: ${reason}. Skip it`)
      return true
    },
    plugin: {
      database: databaseApi
    }
  }
}

type TQueryDatabaseApi = {
  entries: TQueryEntryApi
}

type TQueryEntryApi = {
  findAll: () => Entry[]
  findAllByIdPrefix: (idPrefix: string) => Entry[]
}

function createDatabaseApi(allEntries: Entry[]): TQueryDatabaseApi {
  return {
    entries: {
      findAll() {
        return allEntries
      },
      findAllByIdPrefix(idPrefix: string) {
        if (!idPrefix) {
          return []
        }
        return findAllEntriesByIdPrefix(allEntries, idPrefix)
      }
    }
  }
}
