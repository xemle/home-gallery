import { through } from './through.js';

type TQueueEntry = {
  that: any,
  entry: any,
  callback: () => void
}

export function throttleAsync({passThrough, task, rateLimitMs, startLimitAfterTask}) {
  let last = 0;
  let isTaskRunning = false;
  const queue: TQueueEntry[] = [];

  const next = () => {
    const now = Date.now();
    const diff = now - last;

    if (!queue.length || isTaskRunning) {
      return;
    }
    const {that, entry, callback} = queue[0];
    if (passThrough(entry)) {
      queue.shift();
      that.push(entry);
      callback();
      next();
    } else if (diff > rateLimitMs) {
      queue.shift();
      last = now;
      if (startLimitAfterTask) {
        isTaskRunning = true;
      }
      task(entry, () => {
        that.push(entry);
        callback();
        if (startLimitAfterTask) {
          isTaskRunning = false;
          last = Date.now();
        }
        next();
      });
    } else {
      setTimeout(next, rateLimitMs - diff);
    }
  }

  return through(function (entry, _, cb) {
    queue.push({that: this, entry, callback: cb});

    next();
  }, function(cb) {
    const wait = () => {
      if (queue.length) {
        setTimeout(wait, rateLimitMs);
      } else {
        cb();
      }
    }

    wait();
  });

}

export const throttle = ({rateLimitMs}) => throttleAsync({
  passThrough: () => false,
  task: (_, cb) => cb(),
  rateLimitMs,
  startLimitAfterTask: false
})
