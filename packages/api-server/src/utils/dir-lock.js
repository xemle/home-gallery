const fs = require('fs').promises;

const exists = require('./exists');

const SEC_MS = 1000;
const MIN_MS = 60 * SEC_MS;
const POLL_INTERVAL = 5 * SEC_MS;

const aquireLock = async (lock, timeout) => {
  return fs.mkdir(lock).catch(e => {
    if (timeout > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          aquireLock(lock, timeout - POLL_INTERVAL)
            .then(resolve, reject);
        }, POLL_INTERVAL);
      })
    } else {
      return Promise.reject(new Error(`Could not aquire lock for download`));
    }
  })
}

const releaseLock = async (lock) => fs.rmdir(lock);

const dirLock = async (lockFile, timeout, cb) => {
  // Lock download for shared directory in scaled docker environments
  const lockExists = await exists(lockFile);
  if (lockExists) {
    console.log(`Lock file ${lockFile} exists. Wait for lock release`);
  }
  await aquireLock(lockFile, timeout)
    .then(cb)
    .finally(() => releaseLock(lockFile));
}

module.exports = { dirLock, SEC_MS, MIN_MS };
