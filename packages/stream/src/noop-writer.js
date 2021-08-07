const through2 = require('through2');

const noopWriter = () => through2.obj((entry, _, cb) => cb());

module.exports = noopWriter;