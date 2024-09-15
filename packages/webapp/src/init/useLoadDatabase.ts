import { useEffect } from 'react';

import { useEventStore } from '../store/event-store'

import { fetchAll, syncOfflineDatabase, purgeOfflineDatabase, eventBus } from '../api/ApiService';

import { useAppConfig } from '../utils/useAppConfig'
import { loadDatabase } from '../offline'
import { useOnEntries } from './useOnEntries';

export const useLoadDatabase = () => {
  const reapplyEvents = useEventStore(state => state.reapplyEvents);
  const appConfig = useAppConfig()
  const onEntries = useOnEntries()

  useEffect(() => {
    onEntries(appConfig.entries)

    const onDatabaseReloaded = cb => {
      eventBus.addEventListener('server', event => {
        if (event.action === 'databaseReloaded') {
          console.log(`Reload database due server event`)
          cb()
        }
      })
    }

    const loadOfflineDatabase = async () => {
      const db = await loadDatabase()
      await syncOfflineDatabase(db, onEntries)
      reapplyEvents()
      onDatabaseReloaded(() => syncOfflineDatabase(db, onEntries))
      await purgeOfflineDatabase(db)
    }

    const loadLegacyDatabase = async () => {
      const chunkLimits = [1000, 2000, 4000, 8000, 16000, 32000];
      onDatabaseReloaded(() => fetchAll(chunkLimits, onEntries))
      fetchAll(chunkLimits, onEntries)
        .catch(err => console.log(`Failed to fetch entries by database chunks: ${err}`))
    }


    if (appConfig.disabledOfflineDatabase) {
      console.log('Feature offline database is disabled')
      loadLegacyDatabase()
    } else {
      loadOfflineDatabase()
        .catch(err => {
          console.log(`Failed to load entries via offline database: ${err}. Use fallback`, err)
          loadLegacyDatabase()
        })
    }
  }, []);
}