import { createReadStream } from 'fs'
import crypto from 'crypto'

export const hash = async (file: string, algorithm: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = createReadStream(file);
    const hash = crypto.createHash(algorithm);
    hash.setEncoding('hex');

    input.on('end', () => {
        hash.end();
        resolve(hash.read())
    });
    input.on('error', reject)

    input.pipe(hash);
  })
}