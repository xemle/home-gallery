const through2 = require('through2');

function getEntryMetaByKey(entry, key) {
  if (entry.meta[key]) {
    return entry.meta[key];
  } else if (entry.sidecars.length) {
    for (let i = 0; i < entry.sidecars; i++) {
      if (entry.sidecars[i].meta[key]) {
        return entry.sidecars[i].meta[key];
      }
    }
  }
  return false;
}

function useExif(entry) {
  const exif = getEntryMetaByKey(entry, 'exif');
  if (!exif) {
    return {};
  }

  // {tzoffsetMinutes: 120, rawValue: }
  function parseExiftoolDate(date) {
    let iso8601 = date.rawValue.replace(':', '-').replace(':', '-').replace(' ', 'T');
    if (date.tzoffsetMinutes && !iso8601.match(/\+\d\d:\d\d/)) {
      const offset = Math.abs(date.tzoffsetMinutes);
      const negative = date.tzoffsetMinutes < 0;
      const hour = '' + (offset / 60).toFixed();
      const minute = '' + (offset % 60);
      const offsetText = (negative ? '-' : '+') + hour.padStart(2, '0') + ':' + minute.padStart(2, '0');
      iso8601 += offsetText;
    }

    try {
      return new Date(iso8601).toISOString();
    } catch(e) {
      debug(`Could not create valid ISO8601 date '${iso8601}' from '${date}': ${e}`); 
      return iso8601;
    }
  }

  function getExifDate() {
    if (exif.GPSDateTime) {
      return parseExiftoolDate(exif.GPSDateTime);
    } else if (exif.SubSecDateTimeOriginal) {
      return parseExiftoolDate(exif.SubSecDateTimeOriginal);
    } else if (exif.CreateDate) {
      return parseExiftoolDate(exif.CreateDate);
    }
    return false;
  }

  function getExposerTime() {
    if (!exif.ExposureTime) {
      return {}
    }
    const match = exif.ExposureTime.match(/^(\d+)\/(\d+)$/);
    if (!match) {
      return {}
    }
    return {
      exposureTimeRaw: exif.ExposureTime,
      exposureTimeValue: (+match[1] / +match[2]),
      exposureTimeNumerator: +match[1],
      exposureTimeDivider: +match[2]
    }
  }

  function getShutterSpeed() {
    if (!exif.ShutterSpeed) {
      return {}
    }
    const match = exif.ShutterSpeed.match(/^(\d+)\/(\d+)$/);
    if (!match) {
      return {}
    }
    return {
      sutterSpeedRaw: exif.ShutterSpeed,
      sutterSpeedValue: (+match[1] / +match[2]),
      sutterSpeedNumerator: +match[1],
      sutterSpeedDivider: +match[2]
    }
  }

  const exifDate = getExifDate();
  const date = exifDate ? exifDate : entry.date;
  return Object.assign({
    date,
    year: +date.substr(0, 4),
    month: +date.substr(5, 2),
    day: +date.substr(8, 2),
    tz: exif.tz,
    width: exif.ImageWidth,
    height: exif.ImageHeight,
    duration: exif.MediaDuration || 0,
    make: exif.Make || 'unknown',
    model: exif.Model || 'unknown',
    iso: exif.ISO,
    aperture: exif.ApertureValue,
    exposureMode: exif.ExposureMode,
    focalLength: exif.FocalLength ? +(exif.FocalLength.replace(' mm', '')) : -1,
    focalLength33mm: exif.FocalLengthIn35mmFormat ? +(exif.FocalLengthIn35mmFormat.replace(' mm', '')) : -1,
    orientation: exif.Orientation || 1,
    latitude: exif.GPSLatitude || 0,
    longitude: exif.GPSLongitude || 0,
    altitude: exif.GPSAltitude || 0,
    whiteBalance: exif.WhiteBalance
  }, getExposerTime(), getShutterSpeed())
}

const mapMedia = through2.obj(function (entry, enc, cb) {
  const allStorageFiles = [entry.files]
    .concat(entry.sidecars.map(sidecar => sidecar.files))
    .reduce((r, a) => { a.forEach(v => r.push(v)); return r});

  const mapFile = ({sha1sum, type, size, filename}) => { return { id: sha1sum, type, size, filename }; }

  const media = Object.assign({
    id: entry.sha1sum,
    type: entry.type,
    date: entry.date,
    files: [mapFile(entry)].concat(entry.sidecars.map(mapFile)),
    previews: allStorageFiles.filter(file => file.match(/-preview/))
  }, useExif(entry))

  this.push(media);
  cb();
});

module.exports = mapMedia;