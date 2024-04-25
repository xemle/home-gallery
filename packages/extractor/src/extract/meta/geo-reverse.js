import request from 'request';

import Logger from '@home-gallery/logger'
import { throttleAsync } from '@home-gallery/stream';

import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.geoReverse');

const getAcceptLanguageValue = (languages) => {
  if (typeof languages == 'string') {
    languages = languages.split(',')
  }

  const anyLang = '*;q=0.5';
  const priorities = languages.map((lang, index, array) => {
    const isFirst = index === 0;
    if (isFirst) {
      return lang;
    } else {
      const percent = index * (1 / array.length);
      const q = (1 - 0.5 * percent).toFixed(1);
      return `${lang};q=${q}`;
    }
  }).concat(anyLang);
  return priorities.join(',');
}

const geoReverseSuffix = 'geo-reverse.json';

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {object} options
 * @returns {import('stream').Transform}
 */
async function geoReverse(storage, options) {

  let isLimitExceeded = false;

  function passThrough(entry) {
    if (isLimitExceeded) {
      return true;
    } else if (storage.hasFile(entry, geoReverseSuffix)) {
      return true
    } else if (entry.meta.exif?.GPSPosition) {
      return false;
    } else {
      return true;
    }
  }

  function task(entry, cb) {
    if (!entry.meta.exif?.GPSPosition) {
      return cb();
    }
    const geoPosition = entry.meta.exif?.GPSPosition;
    if (!geoPosition.match(/^[-0-9+.eE]+ [-0-9+.eE]+$/)) {
      log.warn(`Invalid geo position of ${entry}: ${geoPosition}. Expecting space separated lat lon values`);
      return cb();
    }
    const latLon = geoPosition.split(' ');
    const lat = (+latLon[0]).toFixed(7);
    const lon = (+latLon[1]).toFixed(7);
    const geo = `${lat}/${lon}`;
    if (lat === 'NaN' || lon === 'NaN' || Math.max(Math.abs(lat), Math.abs(lon)) < 0.001) {
      log.warn(`Invalid geo position values of ${entry}: ${geoPosition}`);
      return cb();
    }

    const url = `${options.url}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&polygon_geojson=1`;
    const req = {
      url,
      headers: {
        'User-Agent': 'home-gallery/1.0.0',
        'Accept-Language': `${options.acceptLanguage}`
      },
      timeout: 4000,
    }

    const t0 = Date.now();
    request(req, (err, res, body) => {
      if (err) {
        log.error(err, `Could not query geo reverse of ${entry} for ${geo} by URL ${url}: ${err}`);
        return cb();
      } else if (res.statusCode < 100 || res.statusCode >= 300) {
        if (res.statusCode === 429) {
          log.warn(`Bandwidth limit exceeded. Stop querying geo data`);
          isLimitExceeded = true;
        } else {
          log.warn({req, res}, `Could not query geo reverse of ${entry} for ${geo} by URL ${url}: response code is ${res.statusCode} with body ${res.body.replace(/\n/g, '\\n')})`);
        }
        return cb();
      }

      let data
      try {
        data = JSON.parse(body)
      } catch (err) {
        log.warn({req, res}, `Could not parse request body of ${entry} for ${geo} by URL ${url}: ${err}`);
        return cb()
      }

      storage.writeFile(entry, geoReverseSuffix, data)
        .then(() => {
          let info =`${data.osm_type} at ${[data.address?.city, data.address?.country].filter(v => !!v).join(', ')} (${data.address?.country_code?.toUpperCase()})`;
          log.debug(t0, `Successful geo reverse lookup for ${entry} for ${geo}: ${info}`);
        })
        .catch(err => {
          log.error(err, `Could write geo reverse of ${entry} for ${geo}: ${err}`);
        })
        .finally(cb)
    })
  }

  // 1req/1s should be fine. See https://operations.osmfoundation.org/policies/nominatim/
  return throttleAsync({passThrough, task, rateLimitMs: 1000, startLimitAfterTask: true});
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const geoReversePlugin = {
  name: 'geoReverse',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const configOptions = config?.extractor?.geoReverse || {}

    const addressLanguage = configOptions.addressLanguage || ['en', 'de']
    const acceptLanguage = getAcceptLanguageValue(addressLanguage)

    const options = {
      url: 'https://nominatim.openstreetmap.org',
      acceptLanguage,
      ...configOptions
    }

    log.debug(`Use geo server ${options.url} with languages ${addressLanguage}`)

    return geoReverse(context.storage, options)
  },
}

const plugin = toPlugin(geoReversePlugin, 'geoAddressExtractor', ['metaExtractor'])

export default plugin
