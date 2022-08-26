const through = require('./through');

const purge = () => through((entry, _, cb) => cb())

module.exports = purge;
