import path from 'path';
import { group } from '@home-gallery/stream';

export const groupByDir = () => group({
  keyFn: (entry) => path.dirname(entry.filename),
  eager: true
});
