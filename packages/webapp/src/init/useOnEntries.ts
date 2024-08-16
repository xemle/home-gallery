import { useCallback } from 'react';

import { useEntryStore } from '../store/entry-store'
import { mapEntriesForBrowser } from '../api/ApiService';

export const useOnEntries = () => {
  const addEntries = useEntryStore(state => state.addEntries);

  const onEntries = useCallback(entries => {
    if (!entries.length) {
      return
    }
    addEntries(entries.map(mapEntriesForBrowser))
  }, [])

  return onEntries
}
