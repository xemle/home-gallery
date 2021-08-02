import fs, { PathLike } from 'fs';
import readline from 'readline';

const log = require('@home-gallery/logger')('events.read');

import { Event } from './models';
import { HeaderType } from './header';

export const readEvents = (filename: fs.PathLike, cb: (...args: any[]) => void) => {
  let isClosed = false;

  const events: Event[] = [];
  let reader: readline.Interface;
  let lineNumber = 0;

  const readStream = fs.createReadStream(filename);
  readStream.on('error', (err) => {
    isClosed = true;
    cb(err);
    reader && reader.close();
  });

  const checkHeader = (header: any) => {
    if (header?.type != HeaderType) {
      readStream.destroy(new Error(`Unknown events database header: '${JSON.stringify(header).substring(0, 25)}...'. Expect '{"type":"${HeaderType}",...}'. Read CHANGELOG for migration`));
    }
  }

  reader = readline.createInterface({
    input: readStream,
    terminal: false
  });

  reader.on('line', (line) => {
    try {
      const data = JSON.parse(line);
      if (lineNumber++ > 0) {
        events.push(data);
      } else {
        return checkHeader(data);
      }
    } catch (e) {
      log.error(`Could not parse line ${lineNumber}: ${line}`);
    }
  });

  reader.on('error', (err) => {
    isClosed = true;
    cb(err);
    reader.close();
  });

  reader.on('close', () => {
    if (!isClosed) {
      cb(null, events);
    }
  });
}
