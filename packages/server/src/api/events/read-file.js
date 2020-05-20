const fs = require('fs');
const readline = require('readline');
const debug = require('debug')('server:event:read');

const readFile = (filename, cb) => {
  let isClosed = false;

  const events = [];
  let reader;

  const readStream = fs.createReadStream(filename);
  readStream.on('error', (err) => {
    isClosed = true;
    cb(err);
    reader && reader.close();
  });

  reader = readline.createInterface({
    input: readStream,
    terminal: false
  });

  reader.on('line', (line) => {
    try {
      const event = JSON.parse(line);
      events.push(event);
    } catch (e) {
      debug(`Could not parse line: ${line}`);
    }
  });

  reader.on('error', (err) => {
    isClosed = true;
    cb(err);
    reader.close();
  });

  reader.on('close', () => {
    if (!isClosed) {
      debug(`Read ${filename} with ${events.length} events`);
      cb(null, events);
    }
  });
}

module.exports = readFile;
