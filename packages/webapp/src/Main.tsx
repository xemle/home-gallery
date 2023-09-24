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
import { loadDatabase as loadOfflineDatabase, OfflineDatabase } from './offline'
import { applyEvents } from "@home-gallery/events";

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

      const onChunk = entries => {
        addEntries(entries.map(mapEntriesForBrowser))
      }

      onChunk(appConfig.entries)
      eventBus.addEventListener('userAction', event => addEvents([event]))

      const onDatabaseReloaded = cb => {
        eventBus.addEventListener('server', event => {
          if (event.action === 'databaseReloaded') {
            console.log(`Reload database due server event`)
            cb()
          }
        })

      }
      const syncDatabase = (db: OfflineDatabase) => {
        return syncOfflineDatabase(db, onChunk)
          .then(() => {
            console.log(`Load entries via offline database`)
            reapplyEvents()
            onDatabaseReloaded(() => syncOfflineDatabase(db, onChunk))
          })
          .then(() => purgeOfflineDatabase(db))
      }

      const loadLegacyDatabase = () => {
        const chunkLimits = [1000, 2000, 4000, 8000, 16000, 32000];
        onDatabaseReloaded(() => fetchAll(chunkLimits, onChunk))
        fetchAll(chunkLimits, onChunk)
      }

      if (!appConfig.disabledServerEvents) {
        eventStream()
      }
      fetchEvents()
      if (!appConfig.disabledOfflineDatabase) {
        loadOfflineDatabase()
          .then(syncDatabase)
          .catch(err => {
            console.log(`Failed to load entries via offline database: ${err}. Use fallback`, err)
            loadLegacyDatabase()
          })
      } else {
        loadLegacyDatabase()
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
