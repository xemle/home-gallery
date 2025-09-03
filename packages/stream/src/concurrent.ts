import { through } from './through.js';
import Logger from '@home-gallery/logger'

const log = Logger('stream.concurrent');

const noop = () => through((entry, _, cb) => cb(null, entry))

type TQueueEntry = {
  entry: any,
  done: () => void,
  isFlush?: boolean,
  count?: number
}

export const concurrent = (concurrent, countOffset) => {
  concurrent = typeof concurrent == 'undefined' ? 0 : +concurrent
  countOffset = +countOffset || 0
  if (concurrent <= 0) {
    return {
      queueEntry: noop(),
      releaseEntry: noop()
    };
  }
  
  log.info(`Processing queue is limitted to ${concurrent} concurrent entries`)

  let count = 0;
  let runningTasks = 0;
  const queue: TQueueEntry[] = [];

  const next = () => {
    if (!queue.length || runningTasks >= concurrent) {
      return;
    }

    const head = queue.shift();
    if (!head!.isFlush) {
      //log.info(`Start processing entry ${head.entry} (#${head.count})`)
      runningTasks++;
    }
    head!.done();
  }

  const queueEntry = through((entry, _, cb) => {
    const done = () => cb(null, entry);
    queue.push({entry, done, count: countOffset + count++});
    next();
  }, (cb) => {
    queue.push({entry: null, done: cb, isFlush: true});
    next();
  });

  const releaseEntry = through((entry, _, cb) => {
    runningTasks--
    //log.info(`End processing entry ${entry}`)
    cb(null, entry);
    next();
  }, cb => {
    //log.info(`All entries are processed`)
    cb();
  });

  return {
    queueEntry,
    releaseEntry
  }
}
