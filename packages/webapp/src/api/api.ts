
import { baseResolver } from '../base-resolver';
import { Event, EventListener } from '@home-gallery/events'

const decodeBase64 = base64 => atob(base64);

export const fetchAll = async (chunkLimits, onChunk) => {
  let chunkIndex = 0;

  const next = async () => {
    let url = `${baseResolver()}/api/database`;
    let limit = 0;
    if (chunkIndex < chunkLimits.length) {
      const offset = chunkIndex > 0 ? chunkLimits[chunkIndex - 1] : 0;
      limit = chunkLimits[chunkIndex++] - offset;
      url += `?offset=${offset}&limit=${limit}`;
    } else if (chunkLimits.length) {
      const offset = chunkLimits[chunkLimits.length - 1];
      url += `?offset=${offset}`;
    }
    return await fetch(url)
      .then(res => res.json())
      .then(database => {
        if (!database.data || !database.data.length) {
          return;
        }
        onChunk(database.data.map(entry => {
          if (entry.similarityHash) {
            const ascii = decodeBase64(entry.similarityHash);
            entry.similarityHash = ascii;
          }
          return entry;
        }));
        if (limit && database.data.length == limit) {
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
  return await fetch(`${baseResolver()}/api/events`)
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

export const eventStream = (onActionEvent: EventListener) => {
  const events = new EventSource(`${baseResolver()}/api/events/stream`);

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
    }, 2000);
  };
}

export const pushEvent = async (event: Event) => {
  console.log(`push event `, event);

  const response = await fetch(`${baseResolver()}/api/events`, {
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
