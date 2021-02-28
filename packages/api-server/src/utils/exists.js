const fs = require('fs').promises;

const exists = async file => fs.access(file).then(() => true, () => false);

module.exports = exists;