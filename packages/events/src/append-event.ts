import fs from 'fs';
import { Event } from './models';

import { createHeader } from './header';

export const appendEvent = (eventsFilename: fs.PathLike, event: Event, cb: (...args: any[]) => void) => {
  let data = '';
  fs.stat(eventsFilename, (err, stats) => {
    if (err?.code === 'ENOENT' || stats?.size === 0) {
      data += `${JSON.stringify(createHeader())}\n`
    } else if (err) {
      return cb(new Error(`Could not open events database ${eventsFilename}: ${err}`));
    }

    data += `${JSON.stringify(event)}\n`;
    fs.appendFile(eventsFilename, data, (err) => {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  })
}
