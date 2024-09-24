import { group } from '@home-gallery/stream';
import { getEntryFilesCacheKey } from '@home-gallery/storage';

export const groupByEntryFilesCacheKey = () => group({
  keyFn: getEntryFilesCacheKey,
  eager: true
});
