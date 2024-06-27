import path from 'path';
import { group } from '@home-gallery/stream';

export const groupByDir = (maxCount = 0) => group({
  keyFn: (entry) => path.dirname(entry.filename),
  eager: true,
  maxCount
});
