import * as React from "react";

const pad = (s: number | string, len: number, char: string = '0') => {
  let result = '' + s;
  while (result.length < len) {
    result = char + result;
  }
  return result;
}

const pad2 = (s: number | string) => pad(s, 2)

const formatDate = (format, date) => {
  if (!date) {
    return 'Unkown'
  }
  const d = new Date(date);
  return format.replace(/%([dmYHMS])/g, (_, code) => {
    if (code === 'd') return pad2(d.getDate());
    if (code === 'm') return pad2(d.getMonth());
    if (code === 'Y') return pad(d.getFullYear(), 4);
    if (code === 'H') return pad2(d.getHours());
    if (code === 'M') return pad2(d.getMinutes());
    if (code === 'S') return pad2(d.getSeconds());
    return '';
  })
}

const humanizeBytes = bytes => {
  const units = ['', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  while (bytes > 786 && unitIndex < units.length - 1) {
    unitIndex++;
    bytes /= 1024;
  }
  return `${bytes.toFixed(1)}${units[unitIndex]}`;
}

const prefixChar = (value, char, len) => {
  while (value.length < len) {
    value = char + value;
  }
  return value
}

const humanizeDuration = duration => {
  const hour = duration / 3600;
  const min = (duration % 3600) / 60;
  const sec = duration % 60
  return [hour, min, sec].map(v => v.toFixed()).map(v => prefixChar(v, '0', 2)).join(':')
}

export const Details = ({current}) => {
  if (!current) {
    return (<></>)
  }
  const rows = [
    { title: 'Short ID', value: current.id.substring(0, 7) },
    { title: 'Type', value: current.type },
    { title: 'Date', value: formatDate('%d.%m.%Y, %H:%M:%S', current.date) },
    { title: 'Filename', value: `${current.files[0].index}:${current.files[0].filename}` },
    { title: 'Size', value: humanizeBytes(current.files[0].size) },
    { title: 'Duration', value: humanizeDuration(current.duration) },
    { title: 'Dimensions', value: `${current.width}x${current.height}` },
    { title: 'Camera', value: [current.make, current.model].filter(v => !!v).join('/') },
    { title: 'Camera Settings', value: `ISO ${current.iso}, Aperture ${current.aperture}` },
    { title: 'Geo Position', value: [current.latitude, current.longitude].filter(v => !!v).map(v => +v.toFixed(4)).join(',') },
    { title: 'Address', value: [current.road, current.city, current.country].filter(v => !!v).join(', ') },
    { title: 'Tags', value: (current.tags || []).join(', ') },
    { title: 'Objects', value: (current.objects || []).map(object => `${object.class} (${object.score})`).join(', ') },
    { title: 'Faces', value: (current.faces || []).map(face => `${face.gender} (~${face.age.toFixed()}y)`).join(', ') },
  ];

  return (
    <>
      <table className="-striped">
        <thead>
          <tr><th>Type</th><th>Value</th></tr>
        </thead>
        <tbody>
          {rows.map(row => {
            return (
              <tr>
                <td>{row.title}</td><td>{row.value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  )
}

