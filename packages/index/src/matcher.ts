import { IIndexEntry, IIndexEntryMatcherFn } from "./types.js";

export const matcherFns: Record<string, IIndexEntryMatcherFn> = {
  size: (fileEntry: IIndexEntry, fsEntry: IIndexEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType) {
      return true;
    }
    return false;
  },
  'size-ctime': (fileEntry: IIndexEntry, fsEntry: IIndexEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs) {
      return true;
    }
    return false;
  },
  'size-ctime-inode': (fileEntry: IIndexEntry, fsEntry: IIndexEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs &&
      fileEntry.ino === fsEntry.ino) {
      return true;
    }
    return false;
  }
}
