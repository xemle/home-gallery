import { useEffect, useMemo, useRef } from 'react';

import { createEventStream, eventBus, getEvents } from '../api/ApiService';
import { useAppConfig } from '../config/useAppConfig';
import { useEventStore } from '../store/event-store';

export const useLoadEvents = () => {
  const addEvents = useEventStore(state => state.addEvents);
  const resetEvents = useEventStore(state => state.reset);
  const appConfig = useAppConfig()
  const eventStreamRef = useRef(createEventStream(addEvents));

  const { disableServerEvents, disableEvents } = useMemo(() => {
    return {
      disableServerEvents: !!appConfig.disabled?.includes('serverEvents'),
      disableEvents: !!appConfig.disabled?.includes('events')
    }
  }, [appConfig.disabled])

  useEffect(() => {
    if (disableServerEvents) {
      eventStreamRef.current.close()
    } else {
      eventStreamRef.current.start()
    }
  }, [disableServerEvents])

  useEffect(() => {
    if (disableEvents) {
      resetEvents()
      return
    }

    console.log('Fetching events')
    getEvents()
      .then(events => addEvents(events?.data || []))
      .catch(e => {
        console.log(`Could not fetch intitial events: ${e}`);
      })
  }, [disableEvents])

  useEffect(() => {
    eventBus.addEventListener('userAction', event => addEvents([event]))
  }, [])
}
