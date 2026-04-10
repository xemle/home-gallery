import { useEffect, useRef } from 'react';

import { useEventStore } from '../store/event-store';

import { eventBus, fetchAll } from '../api/ApiService';

import { createOfflineDatabase } from '../offline';
import { useEntryStore } from '../store/entry-store';
import { toNativeFactory } from '../utils/to-worker';
import { useAppConfig } from '../config/useAppConfig';
import { useOnEntries } from './useOnEntries';
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl';
import { useAuthStore } from '../store/auth-store';

export const useLoadDatabase = () => {
  const removeEntries = useEntryStore(state => state.removeEntries);
  const resetEntries = useEntryStore(state => state.reset);
  const reapplyEvents = useEventStore(state => state.reapplyEvents);
  const appConfig = useAppConfig()
  const onEntries = useOnEntries()
  const currentUser = useAuthStore(state => state.currentUser)
  const previousUser = useRef(currentUser)

  useEffect(() => {
    const authStateChanged = previousUser.current !== currentUser // true a login or logout
    previousUser.current = currentUser
    if (authStateChanged) {
      resetEntries()
    }
    onEntries(appConfig.entries as [] || [])

    if (appConfig.disabled?.includes('database')) {
      return
    }

    let serverListener: ((event: any) => void) | null = null
    const onDatabaseReloaded = cb => {
      serverListener = event => {
        if (event.action === 'databaseReloaded') {
          console.log(`Reload database due server event`)
          cb()
        }
      }
      eventBus.addEventListener('server', serverListener)
    }

    const loadOfflineDatabase = async () => {
      console.log(`Use offline database for entries`)
      const handlers = {
        onEntries,
        onRemoveEntries: removeEntries
      }
      const baseUrl = toAbsoluteUrl()
      const args = [baseUrl, 5000]
      const offlineDb = toNativeFactory('offlineDatabase', createOfflineDatabase, args, handlers)
      await offlineDb('open')
      if (authStateChanged) {
        console.log(`Invalidating offline database root after user change`)
        await offlineDb('deleteRoot')
      }
      await offlineDb('sync')

      reapplyEvents()
      onDatabaseReloaded(async () => {
        console.log(`Reload offline database from server`)
        await offlineDb('sync')
        reapplyEvents()
      })
    }

    const loadLegacyDatabase = async () => {
      console.log(`Use paged database requests for entries`)
      const chunkLimits = [1000, 2000, 4000, 8000, 16000, 32000]

      async function run() {
        console.log(`Loading database from server`)
        return fetchAll(chunkLimits, onEntries)
          .then(() => reapplyEvents())
          .catch(err => {
            console.log(`Failed to load database: ${err}`, err)
          })
      }

      onDatabaseReloaded(run)
      return run()
    }


    if (appConfig.disabled?.includes('offlineDatabase')) {
      console.log('Feature offline database is disabled')
      loadLegacyDatabase()
    } else {
      loadOfflineDatabase()
        .catch(err => {
          console.log(`Failed to load entries via offline database: ${err}. Use fallback`, err)
          loadLegacyDatabase()
        })
    }
    return () => {
      if (serverListener) {
        eventBus.removeEventListener('server', serverListener)
      }
    }
  }, [currentUser]);
}