export const matcherFns = {
  size: (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType) {
      return true;
    }
    return false;
  },
  'size-ctime': (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs) {
      return true;
    }
    return false;
  },
  'size-ctime-inode': (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs &&
      fileEntry.ino === fsEntry.ino) {
      return true;
    }
    return false;
  }
}
