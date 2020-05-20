import { v4 as uuidv4 } from 'uuid';

import { baseResolver } from './base-resolver';

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
      .then(data => {
        if (!data.media || !data.media.length) {
          return;
        }
        onChunk(data.media);
        if (limit && data.media.length == limit) {
          return next();
        }
      });
  }

  return next();
}

export const getEvents = async () => {
  return await fetch(`${baseResolver()}/api/events`)
      .then(res => res.json())
}

export const eventStream = (onActionEvent) => {
  console.log(`Open EventSource`);
  const events = new EventSource(`${baseResolver()}/api/events/stream`);

  events.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`Unhandled generic event: ${data}`);
    } catch (e) {
      console.log(`Could not read Event: ${e}, ${event.data}`);
    }
  };

  events.addEventListener('actionEvent', (event: MessageEvent) => {
    console.log(`Received action event: ${event}`);
    try {
      const data = JSON.parse(event.data);
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

export const pushEvent = async (event) => {
  const id = uuidv4();
  const response = await fetch(`${baseResolver()}/api/events`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({...event, ...{ id } })
  });
  return response.text();
}
