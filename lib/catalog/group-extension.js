const through2 = require('through2');

const groupByExtensions = through2.obj(function (group, enc, cb) {
  const that = this;

  const groups = {}

  function addEntry(entry, name) {
    if (groups[name]) {
      groups[name].push(entry);
    } else {
      groups[name] = [entry];
    }
  }

  group.forEach(entry => {
    const extMatch1 = entry.filename.match(/(.*)(\.\w{2,4})$/);
    const extMatch2 = extMatch1 && extMatch1[1].match(/(.*)(\.\w{2,4})$/);
    if (extMatch2) {
      addEntry(entry, extMatch2[1]);
    } else if (extMatch1) {
      addEntry(entry, extMatch1[1]);
    } else {
      that.push([entry]);
    }
  })

  Object.values(groups).forEach(group => that.push(group));

  cb()
});

module.exports = groupByExtensions;