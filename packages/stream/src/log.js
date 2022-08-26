const through = require('./through');
const log = require('@home-gallery/logger')('stream.log');

const fn = (data, index) => true;

function pipeLog(name, condition) {
  name = name || '';
  condition = condition || fn;
  let index = 0;

  return through(function (data, _, cb) {
    if (condition(data, index++)) {
      log.info((name ? name + ': ' : '') + JSON.stringify(data));
    }
    this.push(data);
    cb();
  });

}

module.exports = pipeLog;
