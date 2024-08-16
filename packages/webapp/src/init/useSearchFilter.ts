import { useEffect } from 'react'
import { useLogger, usePluginManager } from '../AppContext'
import { useEntryStore } from '../store/entry-store'
import { TQueryContext } from '@home-gallery/types'
import { stringifyEntry } from '@home-gallery/query'
import { useSearchStore } from '../store/search-store'

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
    const queryContext: TQueryContext = {
      textFn(entry) {
        return stringifyEntry(entry)
      },
      queryErrorHandler(ast, context, reason) {
        return true;
      },
      plugin: {
        entryStore: {
          allEntries: allEntries
        }
      }
    }

    let term = ''
    switch (query.type) {
      case 'none': term = ''; break
      case 'query': term = query.value || ''; ; break
      case 'year': term = query.query || ''; queryContext.plugin.year = { value: query.value }; break
      default:
        log.warn(`Search type ${query.type} NYI`)
        break
    }

    manager.executeQuery(allEntries, term, queryContext)
      .then(entries => {
        setEntries(entries)
      })
  }, [allEntries, query])

}