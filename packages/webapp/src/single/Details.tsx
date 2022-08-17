import * as React from "react";

import { humanizeDuration, humanizeBytes, formatDate } from "../utils/format";

export const Details = ({entry, dispatch}) => {
  if (!entry) {
    return (<></>)
  }

  const dispatchSearch = (query) => {
    dispatch({type: 'search', query})
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

  const mainFilename = entry.files[0].filename.replace(/.*[/\\]/g, '')

  const GeoLink = entry => {
    const { latitude, longitude } = entry
    if (!latitude || !longitude) {
      return null
    }

    return (
      <a key={`${entry.shortId}-geo`} onClick={() => dispatch({type: 'map'})}>
        {latitude.toFixed(4)},{longitude.toFixed(4)} (see map)
      </a>
    )
  }

  const rows = [
    { title: 'Short ID', value: entry.id.substring(0, 7) },
    { title: 'Type', value: simpleSearchLink(entry.type, 'type', entry.type) },
    { title: 'Date', value: simpleSearchLink(formatDate('%d.%m.%Y, %H:%M:%S', entry.date), entry.date.substr(0, 10)) },
    { title: 'File', value: entry.files.map(mapFile).reduce(joinReducer(', '), []) },
    { title: 'Duration', value: humanizeDuration(entry.duration) },
    { title: 'Dimensions', value: `${entry.width}x${entry.height}` },
    { title: 'Camera', value: [entry.make, entry.model].filter(v => !!v).map<React.ReactNode>(v => simpleSearchLink(v)).reduce(joinReducer('/'), []) },
    { title: 'Camera Settings', value: `ISO ${entry.iso}, Aperture ${entry.aperture}` },
    { title: 'Geo Position', value: GeoLink(entry)},
    { title: 'Address', value: [entry.road, entry.city, entry.country].filter(v => !!v).map<React.ReactNode>(v => simpleSearchLink(v, 'adress', v)).reduce(joinReducer(', '), []) },
    { title: 'Tags', value: (entry.tags || []).map<React.ReactNode>(v => simpleSearchLink(v, 'tag', v)).reduce(joinReducer(', '), []) },
    { title: 'Objects', value: (entry.objects || []).map<React.ReactNode[]>(object => [simpleSearchLink(object.class), ` (${object.score})`]).reduce(joinReducer(', '), []) },
    { title: 'Faces', value: (entry.faces || []).map(face => `${face.gender} (~${face.age.toFixed()}y)`).join(', ') },
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

