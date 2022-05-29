import { Event, EventListener } from '@home-gallery/events'
import { fetchJsonWorker } from '../utils/fetch-json-worker'

const decodeBase64 = base64 => atob(base64);

const mapEntriesForBrowser = entry => {
  if (entry.similarityHash) {
    const ascii = decodeBase64(entry.similarityHash);
    entry.similarityHash = ascii;
  }
  // reset textCache from polluted fetch command <= 1.4.1
  if (entry.textCache) {
    entry.textCache = false
  }
  return entry;
}

export const fetchAll = async (limits, onChunk) => {
  let limitIndex = 0;
  let offset = 0;
  let chunkStart = Date.now()
  const MAX_CHUNK_DURATION = 5 * 1000

  const next = async () => {
    let url = `api/database.json?offset=${offset}`;
    let limit = limits[limitIndex];
    if (limit > 0) {
      url += `&limit=${limit}`
    }
    const chunkDuration = Date.now() - chunkStart
    if (limitIndex < limits.length - 1 && chunkDuration < MAX_CHUNK_DURATION) {
      limitIndex++;
    }
    chunkStart = Date.now()
    return await fetchJsonWorker(url)
      .then(database => {
        if (!database.data || !database.data.length) {
          return;
        }
        let entries = database.data.map(mapEntriesForBrowser);
        onChunk(entries);
        if (entries.length == limit) {
          offset += entries.length;
          return next();
        }
      });
  }

  return next();
}

export const getEvents = () => fetchJsonWorker(`api/events.json`)

let eventSourceReconnectTimeout = 1000;
const eventSourceReconnectTimeoutMax = 2 * 60 * 1000;

export interface ServerEvent {
  type: string;
  id: string;
  date: string;
  action?: string;
}

export declare type ServerEventListener = (event: ServerEvent) => void;

export const eventStream = (onActionEvent: EventListener, onServerEvent: ServerEventListener) => {
  const events = new EventSource(`api/events/stream`);

  events.addEventListener('open', () => {
    eventSourceReconnectTimeout = 1000;
  })

  events.addEventListener('message', (event: MessageEvent) => {
    console.log(`Received action event: ${event}`);
    try {
      const data = JSON.parse(event.data);
      if (data.type == 'userAction') {
        onActionEvent(data);
      } else if (data.type == 'server') {
        onServerEvent(data);
      }
    } catch (e) {
      console.log(`Could not read Event: ${e}`);
    }
  })

  events.addEventListener('error', event => {
    console.log(`EventSource error. Try to reconnect ${JSON.stringify(event)}`);
    events.close();
    setTimeout(() => {
      eventStream(onActionEvent, onServerEvent);
    }, eventSourceReconnectTimeout);
    eventSourceReconnectTimeout = Math.min(eventSourceReconnectTimeoutMax, eventSourceReconnectTimeout * 2);
  });
}

export const pushEvent = async (event: Event) => {
  console.log(`push event `, event);

  const response = await fetch(`api/events`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  return response.text();
}
