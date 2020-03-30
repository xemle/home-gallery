const path = require('path');
const request = require('request');
const debug = require('debug')('extract:geo-lookup');

const { throttleAsync } = require('../stream/throttle');
const getStoragePaths = require('../storage/storage-path');
const writeEntryFile = require('../storage/write-storage-file');

function geoReverse(storageDir) {
  
  let isLimitExceeded = false;

  function passThrough(entry) {
    if (isLimitExceeded || entry.meta['geoReverse']) {
      return true;
    } else if (entry.meta['exif'] && entry.meta['exif'].GPSPosition) {
      return false;
    } else {
      return true;
    }
  }

  function task(entry, cb) {
    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    const geoReverseFilename = path.join(dir, `${prefix}-geo-reverse.json`);

    if (!entry.meta['exif'] || !entry.meta['exif'].GPSPosition) {
      return cb();
    }
    const geoPosition = entry.meta['exif'].GPSPosition;
    if (!geoPosition.match(/^[-0-9+.eE]+ [-0-9+.eE]+$/)) {
      debug(`Invalid geo position of ${entry}: ${entry.meta['exif'].GPSPosition}. Expecting space separated lat lon values`);
      return cb();
    }
    const latLon = entry.meta['exif'].GPSPosition.split(' ');
    const lat = (+latLon[0]).toFixed(7);
    const lon = (+latLon[1]).toFixed(7);
    const geo = `${lat}/${lon}`;
    if (lat === 'NaN' || lon === 'NaN' || Math.max(Math.abs(lat), Math.abs(lon)) < 0.001) {
      debug(`Invalid geo position values of ${entry}: ${entry.meta['exif'].GPSPosition}`);
      return cb();
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&polygon_geojson=1`;
    const options = {
      url,
      headers: {
        'User-Agent': 'home-gallery/1.0.0'
      }
    }
    const t0 = Date.now();
    request(options, (err, res, body) => {
      if (err) {
        debug(`Could not query geo reverse of ${entry} for ${geo} by URL ${url}: ${err}`);
        return cb();
      } else if (res.statusCode < 100 || res.statusCode >= 300) {
        if (res.statusCode === 429) {
          debug(`Bandwidth limit exceeded. Stop querying geo data`);
          isLimitExceeded = true;
        } else {
          debug(`Could not query geo reverse of ${entry} for ${geo} by URL ${url}: response code is ${res.statusCode} with body ${res.body.replace(/\n/g, '\\n')})`);
        }
        return cb();
      }
      writeEntryFile(entry, storageDir, geoReverseFilename, body, (err) => {
        if (err) {
          debug(`Could write geo reverse of ${entry} for ${geo}: ${err}`);
        } else {
          let info = '';
          try {
            const data = JSON.parse(body);
            const address = data.address || {};
            const countryCode = address.country_code || '??';
            info = `${data.osm_type} at ${[address.city, address.country].filter(v => !!v).join(', ')} (${countryCode.toUpperCase()})`;
          } catch (e) {
            debug(`Could not parse json data ${body}: ${e}`);
          }           
          debug(`Successful geo reverse lookup for ${entry} for ${geo} in ${Date.now() - t0}ms: ${info}`);
        }
        cb();
      });
    })
  }
  
  // 1req/1s should be fine. See https://operations.osmfoundation.org/policies/nominatim/
  return throttleAsync({passThrough, task, rateLimitMs: 1000, startLimitAfterTask: true});
}

module.exports = geoReverse;
