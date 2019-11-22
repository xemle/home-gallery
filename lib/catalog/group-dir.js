const path = require('path');
const through2 = require('through2');

let group = [];
let groupDir = false;

const groupByDir = through2.obj(function (entry, enc, cb) {
  const dir = path.dirname(entry.filename);
  if (groupDir === dir) {
    group.push(entry);
  } else {
    if (groupDir !== false) {
      this.push(group);
    }
    groupDir = dir;
    group = [entry];
  }

  cb();
}, function(cb) {
  if (group.length) {
    this.push(group);
  }
  cb();
});

module.exports = groupByDir;