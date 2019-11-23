const path = require('path');

function getMetaKeyName(filename) {
  // filename = 'ef/84/46859742e8155726a66c308fd6b041f2c673-preview-image.json' => previewImage
  const name = path.basename(filename)
    .replace(/^[0-9a-f]+/, '') // remove checksum
    .replace(/\.\w+$/, '') // remove ext
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase()) // dash-case to camelCase

  return name ? name : 'root';
}

module.exports = getMetaKeyName;