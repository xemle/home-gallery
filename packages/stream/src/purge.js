const through2 = require('through2');

const purge = () => through2.obj((entry, _, cb) => cb())

module.exports = purge;
