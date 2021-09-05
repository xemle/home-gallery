const through2 = require('through2');

const log = require('@home-gallery/logger')('database.mapMedia');
const colorConvert = require('color-convert');

function getEntryMetaByKey(entry, key) {
  if (!entry.meta) {
    log.warn(`Meta data is missing for entry ${entry}`);
    return false;
  } else if (entry.meta[key]) {
    return entry.meta[key];
  } else if (entry.sidecars.length) {
    for (let i = 0; i < entry.sidecars.length; i++) {
      const sidecar = entry.sidecars[i];
      if (!sidecar.meta) {
        log.warn(`Missing meta data of sidecar ${sidecar} of entry ${entry}`);
      } else if (sidecar.meta && sidecar.meta[key]) {
        return sidecar.meta[key];
      }
    }
  }
  return false;
}

const getAllEntryMetaByKey = (entry, key) => {
  const result = []
  if (entry.meta && entry.meta[key]) {
    result.push(entry.meta[key])
  }
  if (entry.sidecars && entry.sidecars.length) {
    entry.sidecars.forEach(sidecar => {
      if (sidecar.meta && sidecar.meta[key]) {
        result.push(sidecar.meta[key])
      }
    })
  }
  return result
}

const reduceMeta = (entry, key, reduceFn, initValue) => {
  const allMeta = getAllEntryMetaByKey(entry, key)
  return allMeta.reduce(reduceFn, initValue)
}

const toArray = value => {
  if (Array.isArray(value)) {
    return value
  } else if (value) {
    return [value]
  } else {
    return []
  }
}

const addUniqValues = (result, values) => toArray(values).filter(value => !result.includes(value)).forEach(value => result.push(value))

const collectTags = entry => {
  const reduceFn = (tags, exif) => {
    addUniqValues(tags, exif.TagList)
    addUniqValues(tags, exif.HierarchicalSubject)
    addUniqValues(tags, exif.Keywords)
    addUniqValues(tags, exif.Subject)
    return tags
  }

  return reduceMeta(entry, 'exif', reduceFn, []).sort()
}

function useExif(entry) {
  const exifMeta = getEntryMetaByKey(entry, 'exif');
  if (!exifMeta) {
    return {};
  }

  // '0000:00:00 00:00:00' => false
  // {tzoffsetMinutes: 120, rawValue: '2004:10:19 10:34:17'} => '2004-10-19T10:34:17+02:00'
  function parseExiftoolDate(date) {
    let value = date.rawValue ? date.rawValue : date;
    if (typeof value !== 'string' || value.length < 10 || value.startsWith('0000')) {
      return false;
    }

    const match = value.match(/(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})(\.\d+)?(([-+](\d{2}:\d{2}|\d{4}))|Z)?\s*$/);
    if (!match) {
      log.warn(`Unknown time format ${value} of ${JSON.stringify(date)} of entry ${entry}`);
      return false;
    }

    let iso8601 = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${match[7] ? match[7] : ''}`;
    if (date.tzoffsetMinutes && !match[8]) {
      const offset = Math.abs(date.tzoffsetMinutes);
      const negative = date.tzoffsetMinutes < 0;
      const hour = '' + (offset / 60).toFixed();
      const minute = '' + (offset % 60);
      const offsetText = (negative ? '-' : '+') + hour.padStart(2, '0') + ':' + minute.padStart(2, '0');
      iso8601 += offsetText;
    } else if (match[8]) {
      iso8601 += match[8];
    }

    try {
      return new Date(iso8601).toISOString();
    } catch(e) {
      log.error(`Could not create valid ISO8601 date '${iso8601}' from '${JSON.stringify(date)}' of entry ${entry}: ${e}`);
      return false;
    }
  }

  function getExifDate(exifMeta) {
    let date = false;
    if (exifMeta.GPSDateTime) {
      date = parseExiftoolDate(exifMeta.GPSDateTime);
    }
    if (!date && exifMeta.SubSecDateTimeOriginal) {
      date = parseExiftoolDate(exifMeta.SubSecDateTimeOriginal);
    }
    if (!date && exifMeta.CreateDate) {
      date = parseExiftoolDate(exifMeta.CreateDate);
    }
    return date;
  }

  function getFractionNumber(prop) {
    let result = {};
    if (!exifMeta[prop]) {
      return result;
    }
    result[`${prop}Raw`] = exifMeta[prop];
    const match = exifMeta[prop].toString().match(/^(\d+)\/(\d+)$/);
    if (match) {
      result[`${prop}Value`] = (+match[1] / +match[2]);
      result[`${prop}Numerator`] = +match[1];
      result[`${prop}Divider`] = +match[2];
    } else if (typeof exifMeta[prop] === 'number') {
      result[`${prop}Value`] = exifMeta[prop];
    }
    result[`${prop}Value`] = +exifMeta[prop];
  }

  function getExposerTime() {
    return getFractionNumber('ExposerTime');
  }

  function getShutterSpeed() {
    return getFractionNumber('ShutterSpeed');
  }

  function widthHeight(exifMeta) {
    let width = exifMeta.ImageWidth;
    let height = exifMeta.ImageHeight;
    if (exifMeta.Orientation >= 5) {
      width = exifMeta.ImageHeight;
      height = exifMeta.ImageWidth;
    }

    if (!width || !height) {
      let fixWidth = width
      let fixHeight = height
      if (width) {
        fixHeight = width
      } else if (height) {
        fixWidth = height
      } else {
        fixWidth = 1280
        fixHeight = 1280
      }
      log.warn(`Entry ${entry} has no valid width/height: ${width}/${height}. Fix it to ${fixWidth}/${fixHeight}`)
      width = fixWidth
      height = fixHeight
    }
    return [width, height]
  }

  const exifDate = getExifDate(exifMeta);
  const date = exifDate ? exifDate : entry.date;
  const [width, height] = widthHeight(exifMeta);

  return Object.assign({
    date,
    year: +date.substr(0, 4),
    month: +date.substr(5, 2),
    day: +date.substr(8, 2),
    tz: exifMeta.tz,
    width,
    height,
    orientation: exifMeta.Orientation,
    duration: exifMeta.MediaDuration || 0,
    make: exifMeta.Make || 'unknown',
    model: exifMeta.Model || 'unknown',
    iso: exifMeta.ISO,
    aperture: exifMeta.ApertureValue,
    exposureMode: exifMeta.ExposureMode,
    focalLength: exifMeta.FocalLength ? +(exifMeta.FocalLength.replace(' mm', '')) : -1,
    focalLength33mm: exifMeta.FocalLengthIn35mmFormat ? +(exifMeta.FocalLengthIn35mmFormat.replace(' mm', '')) : -1,
    orientation: exifMeta.Orientation || 1,
    latitude: exifMeta.GPSLatitude || 0,
    longitude: exifMeta.GPSLongitude || 0,
    altitude: exifMeta.GPSAltitude || 0,
    whiteBalance: exifMeta.WhiteBalance
  }, getExposerTime(), getShutterSpeed())
}

const atob = bytes => Buffer.from(bytes).toString('base64');

const browserEncoder = values => {
  const normalized = values
    .filter((_, i) => i % 3 === 0)
    .map(value => +(3 * Math.sqrt(Math.min(1, Math.max(0, value / 2.875)))).toFixed())
  const len = Math.ceil(normalized.length / 4);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = ((normalized[i * 4] & 3) << 6) ^
      (((normalized[i * 4 + 1] || 0) & 3) << 4) ^
      (((normalized[i * 4 + 2] || 0) & 3) << 2) ^
      ((normalized[i * 4 + 3] || 0) & 3);
  }
  return atob(bytes);
}

const getSimilarityHash = entry => {
  const embeddings = getEntryMetaByKey(entry, 'similarityEmbeddings');
  if (!embeddings || !embeddings.data || !embeddings.data.length) {
    return {};
  }
  return {
    similarityHash: browserEncoder(embeddings.data)
  }
}

const getVibrantColors = entry => {
  const vibrant = getEntryMetaByKey(entry, 'vibrant');
  if (!vibrant) {
    return [];
  }
  return ['Vibrant', 'Muted']
    .map(k => (vibrant[k] || {}).rgb)
    .filter(v => !!v)
    .map(rgb => `#${colorConvert.rgb.hex(...rgb)}`)
}

const getObjects = (entry, minScore) => {
  const objects = getEntryMetaByKey(entry, 'objects');
  if (!objects) {
    return [];
  }
  const { width, height, data } = objects;
  return data
    .filter(object => object.score > minScore)
    .map(object => {
      return {
        x: +(object.bbox[0] / width).toFixed(3),
        y: +(object.bbox[1] / height).toFixed(3),
        width: +(object.bbox[2] / width).toFixed(2),
        height: +(object.bbox[3] / height).toFixed(2),
        score: +object.score.toFixed(2),
        class: object.class
      }
    })
}

const getFaces = (entry, minScore) => {
  const faces = getEntryMetaByKey(entry, 'faces');
  if (!faces) {
    return [];
  }

  const { width, height, data } = faces;
  return data
    .filter(face => face.alignedRect.score >= minScore)
    .map(face => {
      const { box } = face.alignedRect;
      const expressions = Object.keys(face.expressions)
        .map(key => { return {score: face.expressions[key], expression: key }})
        .filter(v => v.score > 0.3)
        .sort((a, b) => a.score - b.score < 0 ? 1 : -1)
        .map(v => v.expression)
        .slice(0, 2)

      return {
        age: +face.age.toFixed(1),
        gender: face.genderProbability > 0.7 ? face.gender : 'unknown',
        expressions,
        x: +(box.x / width).toFixed(3),
        y: +(box.y / height).toFixed(3),
        width: +(box.width / width).toFixed(2),
        height: +(box.height / height).toFixed(2),
        descriptor: Object.values(face.descriptor).map(value => +(value).toFixed(4))
      }
    })
}

const createMedia = entry => {
  const allStorageFiles = [entry.files]
    .concat(entry.sidecars.map(sidecar => sidecar.files))
    .reduce((r, a) => { a.forEach(v => r.push(v)); return r}, []);

  const mapFile = ({sha1sum, indexName, type, size, filename}) => { return { id: sha1sum, index: indexName, type, size, filename }; }

  let exifData = {};
  try {
    exifData = useExif(entry);
  } catch (e) {
    log.warn(e, `Could not extract exif data from entry ${entry}: ${e}`);
  }

  let geoInfo = {};
  const geoReverse = getEntryMetaByKey(entry, 'geoReverse');
  if (geoReverse) {
    ['lat', 'lon', 'addresstype'].forEach(key => geoInfo[key] = geoReverse[key]);
    if (!geoReverse.address) {
      log.warn(`No geo address found for entry ${entry} with geo coordinates ${geoReverse.lat}/${geoReverse.lon}. Skip address`)
    } else {
      const address = geoReverse.address
      const keyMapping = {
        hamlet: 'city',
        village: 'city',
        town: 'city',
      };
      // Unify city information: hamlet < village < town < city. Latest wins
      const addressKeys = ['country', 'state', 'hamlet', 'village', 'town', 'city', 'road', 'house_number']
      addressKeys.forEach(key => {
        if (address[key]) {
          const infoKey = keyMapping[key] || key
          geoInfo[infoKey] = address[key]
        }
      });
    }
  }

  const similarityHash = getSimilarityHash(entry);

  const tags = collectTags(entry)

  const media = Object.assign({
    id: entry.sha1sum,
    type: entry.type,
    date: entry.date,
    files: [mapFile(entry)].concat(entry.sidecars.map(mapFile)),
    previews: allStorageFiles.filter(file => file.match(/-preview/)),
    vibrantColors: getVibrantColors(entry),
    tags,
    objects: getObjects(entry, 0.6),
    faces: getFaces(entry, 0.7)
  }, exifData, geoInfo, similarityHash)

  return media;
}

const mapMedia = through2.obj(function (entry, _, cb) {
  try {
    const media = createMedia(entry)
    this.push(media);
  } catch (e) {
    log.warn(e, `Could not create media entry of ${entry}: ${e}. Skip it`)
  }
  cb();
});

module.exports = mapMedia;
