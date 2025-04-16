import { useCallback } from 'react';

import { useEntryStore } from '../store/entry-store'
import { mapEntriesForBrowser } from '../api/ApiService';
import { Entry } from '../store/entry';

export const useOnEntries = () => {
  const addEntries = useEntryStore(state => state.addEntries);

  let entries: Entry[] = []
  let throttleTimer: any = null

  const onEntries = useCallback(newEntries => {
    if (!newEntries.length) {
      return
    }

    for (const entry of newEntries) {
      entries.push(mapEntriesForBrowser(entry))
    }

    if (throttleTimer) {
      return
    }

    flush()

    function flush() {
      if (!entries.length) {
        throttleTimer = null
        return
      }

      addEntries(entries)
      throttleTimer = setTimeout(flush, 700)
      entries = []
    }
  }, [])

  return onEntries
}
