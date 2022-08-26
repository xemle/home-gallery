const through = require('./through');

const parallel = ({testSync, test, task, concurrent}) => {
  let runningTasks = 0;
  const queue = [];

  if (!testSync && !test) {
    test = (_, cb) => cb(true)
  } else if (testSync && !test) {
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
    if (nextTask.isFlush) {
      nextTask.completed = true;
      return consumeHead();
    }

    nextTask.running = true;
    runningTasks++;

    const taskDone = () => {
      runningTasks--;
      nextTask.completed = true;
      consumeHead();
    }

    test(nextTask.entry, runTask => runTask ? task(nextTask.entry, taskDone) : taskDone())
    next()
  }

  return through(function(entry, _, cb) {
    const that = this
    const isMaxRunning = runningTasks >= concurrent

    // if isMaxRunning defer entry consumption, signal consumption immediately otherwise to queue up next entry
    const done = isMaxRunning ? () => cb(null, entry) : () => that.push(entry);
    queue.push({entry, done, running: false, completed: false, isFlush: false});

    if (!isMaxRunning) {
      cb()
      next()
    }
  }, (cb) => {
    queue.push({entry: null, done: cb, running: false, completed: false, isFlush: true});
    next();
  });

}

module.exports = parallel;