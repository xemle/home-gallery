import path from 'path';
import { group } from '@home-gallery/stream';

export const groupMediaByDir = () => group({
  keyFn: (media) => {
    const firstFile = media.files[0]
    if (!firstFile?.filename) {
      return 'unknownFilename'
    }
    return path.dirname(firstFile.filename)
  },
  eager: true
});
