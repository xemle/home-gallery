const through2 = require('through2');

const MAGIC_LAST_ENTRY = '__PARALELL_QUEUE_END__';

function parallel({test, testAsync, taskAsync, concurrent}) {
  let runningTasks = 0;
  const queue = [];

  if (test && !testAsync) {
    testAsync = (entry, cb) => test(entry) ? cb(true) : cb(false);
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
    if (nextTask.entry === MAGIC_LAST_ENTRY) {
      nextTask.completed = true;
      return consumeHead();
    }

    nextTask.running = true;
    runningTasks++;
    testAsync(nextTask.entry, runTask => {
      if (runTask) {
        taskAsync(nextTask.entry, () => {
          runningTasks--;
          nextTask.completed = true;
          consumeHead();
        });
      } else {
        runningTasks--;
        nextTask.completed = true;
        consumeHead();
      }
    });
  }

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    const done = () => {
      that.push(entry);
    }
    queue.push({entry, done, running: false, completed: false});
    next();
    cb();
  }, function(cb) {
    queue.push({entry: MAGIC_LAST_ENTRY, done: cb, running: false, completed: false});
    next();
  });

}

module.exports = parallel;