const { v4: uuidv4 } = require('uuid');

const log = require('@home-gallery/logger')('server.api.events');

const { readEvents, appendEvent } = require('@home-gallery/events/dist/node');

const { sendError } = require('../error');

/**
 * @param {EventBus} eventbus
 * @param {string} eventsFilename
 * @returns
 */
const events = (eventbus, eventsFilename) => {
  let clients = [];
  let events = false;

  const create = (type, data) => {
    return Object.assign(data, {
      type,
      id: uuidv4(),
      date: new Date().toISOString(),
    })
  }

  const emit = (event) => {
    clients.forEach(c => {
      log.debug(`Send data to client ${c.id}`);
      c.res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  const brideServerEvents = eventNames => {
    eventNames.forEach(name => {
      eventbus.on(name, event => {
        emit(create(name, event))
      })
    })
  }

  const bridgeClientEvents = (event) => {
    emit(event)
    eventbus.emit(event.type, event)
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
    log.info(`Add new client ${newClient}`);

    req.on('end', () => {
      log.info(`Client connection ended. Remove client ${newClient}`);
      removeClient(newClient);
    });

    req.on('close', () => {
      log.info(`Client connection closed. Remove client ${newClient}`);
      removeClient(newClient);
    });

    res.on('err', () => {
      log.warn(`Connection error. Remove client ${newClient}`);
      removeClient(newClient);
    });
  };

  const push = (req, res, next) => {
    const event = req.body;
    if (!isValidEvent(event)) {
      log.warn(`Received invalid event: ${JSON.stringify(event)}`);
      return sendError(res, 400, `Invalid event data`)
    }
    if (!event.id) {
      event.id = uuidv4();
    }
    if (!event.date) {
      event.date = new Date().toISOString();
    }
    appendEvent(eventsFilename, event)
      .then(() => {
        log.info(`Saved event ${event.id} to ${eventsFilename}`);
        if (events !== false) {
          events.data.push(event);
        }
        bridgeClientEvents(event)
        res.status(201).end();
      })
      .catch(err => {
        log.error(err, `Could not save event to ${eventsFilename}. Error: ${err}. Event ${JSON.stringify(event).substr(0, 50)}...`);
        return sendError(res, 500, 'Failed to save event. See server logs for details.')
      })
  }

  const getEvents = cb => {
    if (events !== false) {
      return cb(null, events)
    }
    const t0 = Date.now();
    readEvents(eventsFilename)
      .then(data => {
        events = data;
        log.info(t0, `Read events file ${eventsFilename} with ${events.data.length} events`);
        cb(null, events)
      })
      .catch(err => {
        cb(err)
      })
  }

  const read = (_, res) => {
    const t0 = Date.now();
    getEvents((err, events) => {
      if (err && err.code === 'ENOENT') {
        log.info(`Events file ${eventsFilename} does not exist yet. Create an event to initialize it`);
        return sendError(res, 404, 'Events file does not exist yet. Create an event to initialize it')
      } else if (err) {
        log.error(err, `Failed to read events file ${eventsFilename}: ${err}`);
        return sendError(res, 500, 'Loading event file failed. See server logs')
      }
      log.debug(t0, `Send ${events.data.length} events`)
      return res.json(events);
    });
  }

  brideServerEvents(['server']);
  return {
    read,
    stream,
    push,
    getEvents
  };
}

module.exports = events;
