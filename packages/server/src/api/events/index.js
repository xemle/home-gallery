const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('server:events');

const append = require('./append-file');
const readFile = require('./read-file');

const events = (filename) => {
  let clients = [];

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
    const data = req.body;
    if (!isValidEvent(data)) {
      debug(`Received invalid event: ${JSON.stringify(data)}`);
      res.status(400).end();
      return;
    }
    if (!data.id) {
      data.id = uuidv4();
    }
    if (!data.date) {
      data.date = new Date().toISOString();
    }
    append(filename, data, (err) => {
      if (err) {
        console.log(`Could not save event to ${filename}. Error: ${err}. Event ${JSON.stringify(data).substr(0, 50)}...`);
        res.status(500).end();
      } else {
        debug(`New event ${data.id} created`);
        sendEventsToAll(data);
        res.status(201).end();
      }
    });
  }

  const read = (req, res, next) => {
    readFile(filename, (err, events) => {
      if (err) {
        const status = err.code === 'ENOENT' ? 404 : 500;
        return res.status(status).end();
      }
      res.json({ data: events });
    });
  }

  return { read, stream, push };
}

module.exports = events;
