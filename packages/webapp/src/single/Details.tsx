import * as React from "react";
import {
  useHistory
} from "react-router-dom";

import { humanizeDuration, humanizeBytes, formatDate } from "../utils/format";

export const Details = ({current}) => {
  const history = useHistory();

  if (!current) {
    return (<></>)
  }

  const dispatchSearch = (query) => {
    history.push(`/search/${encodeURIComponent(query)}`);
  }

  const escapeSearchValue = value => /[\s]/.test(value) ? `"${value}"` : value

  const queryTerm = (key, value, op?) => {
    let query
    if (key && value && op) {
      query = `${key}${op}${escapeSearchValue(value)}`
    } else if (key && value) {
      query = `${key}:${escapeSearchValue(value)}`
    } else if (key) {
      query = `${escapeSearchValue(key)}`
    }
    return query
  }

  const searchLink = (text, query) => {
    return <a key={query} onClick={() => dispatchSearch(query)} title={`Search for '${query}'`}>{text}</a>
  }

  const simpleSearchLink = (text, key?, value?) => {
    let query = queryTerm(key || text, value)
    return searchLink(text, query)
  }

  const joinReducer = c => (prev, cur) => prev.length ? [prev, c, cur] : [cur]

  const mapFile = file => {
    const indexTerm = queryTerm('index', file.index)

    const filename = file.filename
    const links = []
    let lastPos = 0
    filename.replace(/[\\/]/g, (sep, pos) => {
      const name = filename.substring(lastPos, pos)
      const path = filename.substring(0, pos)
      const pathTerm = queryTerm('path', path, '~')
      links.push(searchLink(name, `${indexTerm} ${pathTerm}`))
      links.push(sep)
      lastPos = pos + 1
    })
    const basename = filename.substring(lastPos)
    links.push(searchLink(basename, queryTerm('filename', basename, '~')))

    return [simpleSearchLink(file.index, `index:${file.index}`), ':', links, ` ${humanizeBytes(file.size)}`]
  }

  const mainFilename = current.files[0].filename.replace(/.*[/\\]/g, '')

  const rows = [
    { title: 'Short ID', value: current.id.substring(0, 7) },
    { title: 'Type', value: simpleSearchLink(current.type, 'type', current.type) },
    { title: 'Date', value: simpleSearchLink(formatDate('%d.%m.%Y, %H:%M:%S', current.date), current.date.substr(0, 10)) },
    { title: 'File', value: current.files.map(mapFile).reduce(joinReducer(', '), []) },
    { title: 'Duration', value: humanizeDuration(current.duration) },
    { title: 'Dimensions', value: `${current.width}x${current.height}` },
    { title: 'Camera', value: [current.make, current.model].filter(v => !!v).map<React.ReactNode>(v => simpleSearchLink(v)).reduce(joinReducer('/'), []) },
    { title: 'Camera Settings', value: `ISO ${current.iso}, Aperture ${current.aperture}` },
    { title: 'Geo Position', value: [current.latitude, current.longitude].filter(v => !!v).map(v => +v.toFixed(4)).join(',') },
    { title: 'Address', value: [current.road, current.city, current.country].filter(v => !!v).map<React.ReactNode>(v => simpleSearchLink(v, 'adress', v)).reduce(joinReducer(', '), []) },
    { title: 'Tags', value: (current.tags || []).map<React.ReactNode>(v => simpleSearchLink(v, 'tag', v)).reduce(joinReducer(', '), []) },
    { title: 'Objects', value: (current.objects || []).map<React.ReactNode[]>(object => [simpleSearchLink(object.class), ` (${object.score})`]).reduce(joinReducer(', '), []) },
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
          {rows.map((row, i) => {
            return (
              <tr key={i}>
                <td>{row.title}</td><td>{row.value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  )
}

