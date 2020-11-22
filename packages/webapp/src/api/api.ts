import { Event, EventListener } from '@home-gallery/events'

const decodeBase64 = base64 => atob(base64);

const mapEntriesForBrowser = entry => {
  if (entry.similarityHash) {
    const ascii = decodeBase64(entry.similarityHash);
    entry.similarityHash = ascii;
  }
  return entry;
}

export const fetchAll = async (limits, onChunk) => {
  let limitIndex = 0;
  let offset = 0;

  const next = async () => {
    let url = `api/database?offset=${offset}`;
    let limit = limits[limitIndex];
    if (limit > 0) {
      url += `&limit=${limit}`
    }
    if (limitIndex < limits.length - 1) {
      limitIndex++;
    }
    return await fetch(url)
      .then(res => res.json())
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

const isSuccessfullResponse = res => res.status >= 200 && res.status < 300;

class EventError extends Error {
  constructor(message: string) {
    super(message);
  }

  res: any;
}

export const getEvents = async () => {
  return await fetch(`api/events`)
      .then(res => {
        if (isSuccessfullResponse(res)) {
          return res.json()
        } else {
          const err = new EventError(`Failed to fetch events. Reponse status code is ${res.status}`);
          err.res = res;
          throw err;
        }
      })
}

let eventSourceReconnectTimeout = 1000;
const eventSourceReconnectTimeoutMax = 2 * 60 * 1000;

export const eventStream = (onActionEvent: EventListener) => {
  const events = new EventSource(`api/events/stream`);

  events.onopen = () => {
    eventSourceReconnectTimeout = 1000;
  }

  events.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`Unhandled generic event: ${data}`);
    } catch (e) {
      console.log(`Could not read Event: ${e}, ${event.data}`);
    }
  };

  events.addEventListener('userAction', (event: MessageEvent) => {
    console.log(`Received action event: ${event}`);
    try {
      const data: Event = JSON.parse(event.data);
      onActionEvent(data);
    } catch (e) {
      console.log(`Could not read Event: ${e}`);
    }
  })

  events.onerror = (event) => {
    console.log(`EventSource error. Try to reconnect ${JSON.stringify(event)}`);
    events.close();
    setTimeout(() => {
      eventStream(onActionEvent);
    }, eventSourceReconnectTimeout);
    eventSourceReconnectTimeout = Math.min(eventSourceReconnectTimeoutMax, eventSourceReconnectTimeout * 2);
  };
}

export const pushEvent = async (event: Event) => {
  console.log(`push event `, event);

  const response = await fetch(`api/events`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  return response.text();
}
