const through2 = require('through2');

function parallel({testSync, test, task, concurrent}) {
  let runningTasks = 0;
  const queue = [];

  if (testSync && !test) {
    test = (entry, cb) => testSync(entry) ? cb(true) : cb(false);
  }

  const consumeHead = () => {
    while (queue.length && queue[0].completed) {
      const head = queue.shift();
      head.done();
    }
    next();
  }

  const next = () => {
    if (!queue.length || runningTasks >= concurrent) {
      return;
    } 
    
    let nextTaskIndex = 0;
    while (nextTaskIndex < queue.length && (queue[nextTaskIndex].running || queue[nextTaskIndex].completed)) {
      nextTaskIndex++;
    }
    if (nextTaskIndex == queue.length) {
      return;
    }

    const nextTask = queue[nextTaskIndex];
    if (nextTask.flush) {
      nextTask.completed = true;
      return consumeHead();
    }

    nextTask.running = true;
    runningTasks++;
    task(nextTask.entry, () => {
      runningTasks--;
      nextTask.completed = true;
      consumeHead();
    });
  }

  return through2.obj(function (entry, _, cb) {
    const that = this;
    const done = () => {
      that.push(entry);
    }
    queue.push({entry, done, running: false, completed: false, flush: false});
    next();
    cb();
  }, function(cb) {
    queue.push({entry: null, done: cb, running: false, completed: false, flush: true});
    next();
  });

}

module.exports = parallel;