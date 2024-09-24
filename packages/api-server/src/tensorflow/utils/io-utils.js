// Source https://github.com/tensorflow/tfjs/blob/73a09c2357aeb2c258f7d6a52eecb341d40c9939/tfjs-node/src/io/io_utils.ts
export const toArrayBuffer = (buf) => {
  let totalLength = 0;
  for (const buffer of buf) {
    totalLength += buffer.length;
  }

  const ab = new ArrayBuffer(totalLength);
  const view = new Uint8Array(ab);
  let pos = 0;
  for (const buffer of buf) {
    pos += buffer.copy(view, pos);
  }
  return ab;
}
