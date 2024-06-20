import * as React from "react";
import {useEffect} from 'react';
import {
    BrowserRouter,
    Navigate,
    Routes,
    Route,
  } from "react-router-dom";

import { LastLocationProvider } from './utils/lastLocation/LoastLocationProvider'
import { useEntryStore } from './store/entry-store'
import { useEventStore } from './store/event-store'

import { fetchAll, getEvents, eventStream, mapEntriesForBrowser, syncOfflineDatabase, purgeOfflineDatabase, eventBus } from './api/ApiService';

import { AllView } from "./list/All";
import { SearchView } from './list/Search';
import { SimilarView } from './list/Similar';
import { FacesView } from './list/Faces';
import { Years, YearView } from './year/Years';
import { Tags } from './tags/Tags';
import { Map } from './map';
import { MediaView } from './single/MediaView';
import { useAppConfig } from './utils/useAppConfig'
import { loadDatabase, OfflineDatabase } from './offline'

export const Root = () => {
  return (
    <Main />
  )
}

export const Main = () => {
    const addEntries = useEntryStore(state => state.addEntries);
    const addEvents = useEventStore(state => state.addEvents);
    const reapplyEvents = useEventStore(state => state.reapplyEvents);
    const appConfig = useAppConfig()

    useEffect(() => {
      const fetchEvents = () => getEvents()
        .then(events => addEvents(events?.data || []))
        .catch(e => {
          console.log(`Could not fetch intitial events: ${e}`);
        })

      const onEntries = entries => {
        if (!entries.length) {
          return
        }
        addEntries(entries.map(mapEntriesForBrowser))
      }

      onEntries(appConfig.entries)
      eventBus.addEventListener('userAction', event => addEvents([event]))

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

      if (appConfig.disabledServerEvents) {
        console.log('Feature event stream is disabled')
      } else {
        eventStream()
      }
      fetchEvents()
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

    const base = document.querySelector('base')?.getAttribute('href') || '/';

    return (
      <BrowserRouter basename={base}>
        <LastLocationProvider>
          <Routes>
            <Route path="/" element={<AllView />} />
            <Route path="/years" element={<Years />} />
            <Route path="/years/:year" element={<YearView />} />
            <Route path="/view/:id" element={<MediaView />} />
            <Route path="/similar/:id" element={<SimilarView />} />
            <Route path="/search/:term" element={<SearchView />} />
            <Route path="/faces/:id/:faceIndex" element={<FacesView />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/map" element={<Map />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LastLocationProvider>
      </BrowserRouter>
    );
}
