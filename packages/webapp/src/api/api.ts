import { Event, EventListener } from '@home-gallery/events'
import { fetchJsonWorker } from '../utils/fetch-json-worker'
import { byPreviewSize } from '../utils/preview'

const decodeBase64 = base64 => atob(base64);

export const mapEntriesForBrowser = entry => {
  if (entry.similarityHash) {
    const ascii = decodeBase64(entry.similarityHash);
    entry.similarityHash = ascii;
  }
  entry.shortId = entry.id.substring(0, 12)
  if (entry.previews?.length) {
    entry.previews.sort(byPreviewSize)
  }
  // reset textCache from polluted fetch command <= 1.4.1
  if (entry.textCache) {
    entry.textCache = false
  }
  // latitude and longitude are only set for main files <= 1.6
  // lat and lon are values from geo reverse lookup (also from side cars)
  if (entry.lat && !entry.latitude && entry.lon && !entry.longitude) {
    entry.latitude = +entry.lat
    entry.longitude = +entry.lon
  }

  return entry;
}

export const fetchAll = async (limits, onChunk) => {
  let limitIndex = 0;
  let offset = 0;
  const MAX_CHUNK_DURATION = 3 * 1000

  const increaseLimit = (offset, limit, chunkStart) => {
    const chunkDuration = Date.now() - chunkStart
    if (limitIndex >= limits.length - 1            // already the last limitIndex
        || chunkDuration > MAX_CHUNK_DURATION      // long request
        || limit != limits[limitIndex]             // non matching current limit
        || offset % limits[limitIndex + 1] != 0) { // new limit does not match current offset
      return
    }
    limitIndex++;
  }

  const next = async () => {
    let url = `api/database.json?offset=${offset}`;
    let limit = limits[limitIndex];
    if (limit > 0) {
      url += `&limit=${limit}`
      offset += limit
    }
    let chunkStart = Date.now()
    return await fetchJsonWorker(url)
      .then(database => {
        if (!database.data || !database.data.length) {
          return;
        }
        let entries = database.data.map(mapEntriesForBrowser);
        onChunk(entries);
        if (entries.length == limit) {
          increaseLimit(offset, limit, chunkStart);
          return next();
        }
      });
  }

  return Promise.all([next(), next()])
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
