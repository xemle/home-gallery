const through2 = require('through2');
const debug = require('debug')('stream:print');

const fn = (data, index) => true;
function log(name, condition) {
  name = name || '';
  condition = condition || fn;
  let index = 0;

  return through2.obj(function (data, enc, cb) {
    if (condition(data, index++)) {
      debug((name ? name + ': ' : '') + JSON.stringify(data));
    }
    this.push(data);
    cb();
  });

}

module.exports = log;
