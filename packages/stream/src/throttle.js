const through2 = require('through2');

function throttleAsync({passThrough, task, rateLimitMs, startLimitAfterTask}) {
  let last = 0;
  let isTaskRunning = false;
  const queue = [];

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

  return through2.obj(function (entry, enc, cb) {
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

module.exports = {
  throttleAsync,
  throttle: ({rateLimitMs}) => throttleAsync({
    passThrough: () => false, 
    task: (_, cb) => cb(),
    rateLimitMs,
    startLimitAfterTask: false
  })
};