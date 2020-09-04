const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('server:events');

const { readEvents, appendEvent } = require('@home-gallery/events/dist/node');

const events = (eventsFilename) => {
  let clients = [];
  let eventsCache = false;

  const sendEventsToAll = (data) => {
    clients.forEach(c => {
      console.log(`Sed data to client ${c.id}`);
      if (data.type) {
        c.res.write(`event: ${data.type}\n`);
      }
      c.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }

  const removeClient = (client) => {
    const index = clients.indexOf(client);
    clients.splice(index, 1);
  }

  const isValidEvent = (data) => {
    if (!data.type) {
      return false;
    } else if (data.type === 'userAction' && (!data.targetIds || !data.targetIds.length || !data.actions || !data.actions.length)) {
      return false;
    }

    return true;
  }

  const stream = (req, res, next) => {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      "Content-Encoding": "none"
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    res.write(`event: hello\nid: ${Date.now()}\ndata: ${clientId}\n\n\n`);
    const newClient = {
      id: clientId,
      res,
      toString: function() {
        return this.id;
      }
    };

    clients.push(newClient);
    debug(`Add new client ${newClient}`);

    req.on('end', () => {
      debug(`Client connection ended. Remove client ${newClient}`);
      removeClient(newClient);
    });

    req.on('close', () => {
      debug(`Client connection closed. Remove client ${newClient}`);
      removeClient(newClient);
    });

    res.on('err', () => {
      debug(`Connection error. Remove client ${newClient}`);
      removeClient(newClient);
    });
  };

  const push = (req, res, next) => {
    const event = req.body;
    if (!isValidEvent(event)) {
      debug(`Received invalid event: ${JSON.stringify(event)}`);
      res.status(400).end();
      return;
    }
    if (!event.id) {
      event.id = uuidv4();
    }
    if (!event.date) {
      event.date = new Date().toISOString();
    }
    appendEvent(eventsFilename, event, (err) => {
      if (err) {
        console.log(`Could not save event to ${eventsFilename}. Error: ${err}. Event ${JSON.stringify(event).substr(0, 50)}...`);
        res.status(500).end();
      } else {
        debug(`New event ${event.id} created`);
        if (eventsCache !== false) {
          eventsCache.push(event);
        }
        sendEventsToAll(event);
        res.status(201).end();
      }
    });
  }

  const read = (req, res, next) => {
    if (eventsCache !== false) {
      debug(`Send ${eventsCache.length} cached events`);
      return res.json({ data: eventsCache });
    }

    const t0 = Date.now();
    readEvents(eventsFilename, (err, events) => {
      if (err && err.code === 'ENOENT') {
        eventsCache = [];
        return res.status(404).end();
      } else if (err) {
        debug(`Failed to read events file ${eventsFilename}: ${err}`);
        return res.status(500).end();
      }
      eventsCache = events;
      debug(`Read events file ${eventsFilename} in ${Date.now() - t0}ms and send ${eventsCache.length} events`);
      return res.json({ data: eventsCache });
    });
  }

  return { read, stream, push };
}

module.exports = events;
