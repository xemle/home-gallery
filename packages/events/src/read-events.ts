import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

import Logger from '@home-gallery/logger'
const log = Logger('events.read')

import { Event } from './models.js';
import { EventDatabase, HeaderType, isEventTypeCompatible } from './header.js';

const readEventsCb = (filename: fs.PathLike, cb: (...args: any[]) => void) => {
  let isClosed = false;

  let header: false | any = false;
  const events: Event[] = [];
  let reader: readline.Interface;
  let lineNumber = 0;

  const readStream = fs.createReadStream(filename);
  readStream.on('error', (err) => {
    isClosed = true;
    cb(err);
    reader && reader.close();
  });

  const checkHeader = (data: any) => {
    if (!isEventTypeCompatible(data?.type)) {
      const err = new Error(`Unknown events database header: '${JSON.stringify(data).substring(0, 45)}...'. Expect '{"type":"${HeaderType}",...}'`)
      log.error(err, err.message)
      return readStream.destroy(err);
    }
    header = data;
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
      log.error(e, `Could not parse line ${lineNumber}: ${line}`);
    }
  });

  reader.on('error', (err) => {
    if (isClosed) {
      return;
    }
    isClosed = true;
    cb(err);
    reader.close();
  });

  reader.on('close', () => {
    if (isClosed) {
      return
    } else if (header) {
      header.data = events;
      cb(null, header);
    } else {
      cb(new Error(`No event header found`));
    }
  });
}

export const readEvents = promisify<fs.PathLike, EventDatabase>(readEventsCb)
