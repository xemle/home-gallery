const jpeg = require('jpeg-js');

// from https://github.com/tensorflow/tfjs/blob/07ce4516134fff8283ec43c4497c91a0f6a28dda/tfjs-react-native/src/decode_image.ts#L34
const readJpeg = (contents) => {
  const {width, height, data} = jpeg.decode(contents, {useTArray: true});
  // Drop the alpha channel info because jpeg.decode always returns a typedArray with 255
  const buffer = new Uint8Array(width * height * 3);
  let offset = 0;  // offset into original data
  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = data[offset];
    buffer[i + 1] = data[offset + 1];
    buffer[i + 2] = data[offset + 2];

    offset += 4;
  }

  return {buffer, width, height}
}

module.exports = readJpeg;