import * as React from "react";
import {
  useHistory
} from "react-router-dom";

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
    if (code === 'm') return pad2(d.getMonth() + 1);
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
  const history = useHistory();

  if (!current) {
    return (<></>)
  }

  const dispatchSearch = (query) => {
    history.push(`/search/${query}`);
  }

  const searchTerm = (text, query = false) => {
    query = query || text
    return <a onClick={() => dispatchSearch(query)} title={`Quick search for '${query}'`}>{text}</a>
  }

  const joinReducer = c => (prev, cur) => prev.length ? [prev, c, cur] : [cur]

  const getFileParts = file => file.filename.split(/[/\\]/)

  const mapFile = file => {
    const fileParts: React.ReactNode[] = getFileParts(file)
    const links = fileParts.map<React.ReactNode>(v => searchTerm(v)).reduce(joinReducer('/'), [])
    return [file.index, ':', links, ` ${humanizeBytes(file.size)}`]
  }

  const mainFilename = getFileParts(current.files[0]).pop()

  const rows = [
    { title: 'Short ID', value: current.id.substring(0, 7) },
    { title: 'Type', value: searchTerm(current.type) },
    { title: 'Date', value: searchTerm(formatDate('%d.%m.%Y, %H:%M:%S', current.date), current.date.substr(0, 10)) },
    { title: 'File', value: current.files.map(mapFile).reduce(joinReducer(', '), []) },
    { title: 'Duration', value: humanizeDuration(current.duration) },
    { title: 'Dimensions', value: `${current.width}x${current.height}` },
    { title: 'Camera', value: [current.make, current.model].filter(v => !!v).map<React.ReactNode>(v => searchTerm(v)).reduce(joinReducer('/'), []) },
    { title: 'Camera Settings', value: `ISO ${current.iso}, Aperture ${current.aperture}` },
    { title: 'Geo Position', value: [current.latitude, current.longitude].filter(v => !!v).map(v => +v.toFixed(4)).join(',') },
    { title: 'Address', value: [current.road, current.city, current.country].filter(v => !!v).map<React.ReactNode>(v => searchTerm(v)).reduce(joinReducer(', '), []) },
    { title: 'Tags', value: (current.tags || []).map<React.ReactNode>(v => searchTerm(v)).reduce(joinReducer(', '), []) },
    { title: 'Objects', value: (current.objects || []).map<React.ReactNode[]>(object => [searchTerm(object.class), ` (${object.score})`]).reduce(joinReducer(', '), []) },
    { title: 'Faces', value: (current.faces || []).map(face => `${face.gender} (~${face.age.toFixed()}y)`).join(', ') },
  ];

  return (
    <>
      <h3 className="mb-8">{mainFilename}</h3>
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

