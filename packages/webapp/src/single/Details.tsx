import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { humanizeDuration, humanizeBytes, formatDate } from "../utils/format";
import { useTagDialog } from "../dialog/use-tag-dialog";
import { useNavigate } from "react-router-dom";
import { addTags, addFaceTags } from '../api/ApiService';
import { Tag, FaceTag } from "../api/models";
import { useAppConfig } from "../utils/useAppConfig";
import { classNames } from "../utils/class-names";

export const Details = ({ entry, dispatch }) => {
  const appConfig = useAppConfig()
  const navigate = useNavigate();

  const { openTagsDialog, setTagsDialogVisible, openFaceTagsDialog, setFaceTagsDialogVisible } = useTagDialog()

  if (!entry) {
    return (<></>)
  }

  const dispatchSearch = (query) => {
    dispatch({ type: 'search', query })
  }

  const escapeSearchValue = value => /[\s+]/.test(value) ? `"${value}"` : value

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
    return <a className="text-gray-300 break-all rounded hover:cursor-pointer hover:bg-gray-600 hover:text-gray-200" key={query} onClick={() => dispatchSearch(query)} title={`Search for '${query}'`}>{text}</a>
  }

  const simpleSearchLink = (text, key?, value?) => {
    let query = queryTerm(key || text, value)
    return searchLink(text, query)
  }

  const sepSpan = sep => {
    return (
      <span className="px-1">{sep}</span>
    )
  }

  const mapFile = file => {
    const indexTerm = queryTerm('index', file.index)

    const filename = file.filename
    const links: React.JSX.Element[] = []
    let lastPos = 0
    filename.replace(/[\\/]/g, (sep, pos) => {
      const name = filename.substring(lastPos, pos)
      const path = filename.substring(0, pos)
      const pathTerm = queryTerm('path', path, '~')
      links.push(searchLink(name, `${indexTerm} ${pathTerm}`))
      links.push(sepSpan(sep))
      lastPos = pos + 1
    })
    const basename = filename.substring(lastPos)
    links.push(searchLink(basename, queryTerm('filename', basename, '~')))

    return [
      simpleSearchLink(file.index, `index:${file.index}`),
      sepSpan(':'),
      ...links,
      ` ${humanizeBytes(file.size)}`
    ]
  }

  const mainFilename = entry.files[0].filename.replace(/.*[/\\]/g, '')

  const hasAddress = entry => entry.road || entry.city || entry.country

  const hasGeo = entry => entry.latitude || entry.longitute

  const GeoLink = entry => {
    const { latitude, longitude } = entry
    if (!latitude || !longitude) {
      return null
    }

    return (
      <a key={`${entry.shortId}-geo`} className="text-gray-300 break-all rounded hover:cursor-pointer hover:bg-gray-600 hover:text-gray-200" onClick={() => dispatch({ type: 'map' })}>
        {latitude.toFixed(4)},{longitude.toFixed(4)} (open map)
      </a>
    )
  }

  const initialTags: Tag[] = (entry.tags || []).map(name => ({ name, remove: false }))

  const initialFaceTags: FaceTag[] = (entry.faces || []).map((face) => ({
    name: face.faceTag,
    rect: {
      x: +face.x,
      y: +face.y,
      width: +face.width,
      height: +face.height
    }
  }))

  const onTagsSubmit = ({ tags }: { tags: Tag[] }) => {
    const tagNames = tags.map(({ name }) => name)
    const origTagNames = entry.tags || []
    const tagActions = origTagNames.filter(name => !tagNames.includes(name)).map(name => ({ name, remove: true }))
    tagActions.push(...tagNames.filter(name => !origTagNames.includes(name)).map(name => ({ name, remove: false })))
    if (tagActions.length) {
      addTags([entry.id], tagActions).then(() => {
        setTagsDialogVisible(false);
      })
    } else {
      setTagsDialogVisible(false);
    }

    return false;
  }

  const onFaceTagsSubmit = ({ faceTags }: { faceTags: FaceTag[] }) => {
    const contains = (faceTag: FaceTag, allTags: FaceTag[]) => {
      return allTags.filter(tag => tag.name == faceTag.name
        && tag.rect.x == faceTag.rect.x
        && tag.rect.x == faceTag.rect.x
        && tag.rect.x == faceTag.rect.x
        && tag.rect.x == faceTag.rect.x
      ).length > 0;
    }

    const faceTagActions = initialFaceTags.filter(tag => !contains(tag, faceTags))
      .map(tag => ({ name: tag.name, rect: tag.rect, remove: true }))

    faceTagActions.push(...faceTags.filter(tag => !contains(tag, initialFaceTags))
      .map(tag => ({ name: tag.name, rect: tag.rect, remove: false })))

    console.log(initialFaceTags);
    console.log(faceTags);
    console.log(faceTagActions);
    if (faceTagActions.length) {
      addFaceTags([entry.id], faceTagActions).then(() => {
        setFaceTagsDialogVisible(false);
      })
    } else {
      setFaceTagsDialogVisible(false);
    }

    return false;
  }

  const editTags = () => {
    openTagsDialog({ initialTags, onTagsSubmit })
  }

  const editFaceTags = () => {
    openFaceTagsDialog({ initialFaceTags, onFaceTagsSubmit })
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-gray-300">Media Details</h3>
          <a className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 hover:cursor-pointer"
            onClick={() => dispatch({ type: 'toggleDetails' })}
            title="Close media details">
            <FontAwesomeIcon icon={icons.faXmark} className="text-gray-700 hover:text-gray-400 active:text-gray-200" />
          </a>
        </div>
        <div className="flex flex-col gap-6 text-gray-500">

          {/* Type */}
          <div className="flex">
            <div className="w-8">
              <FontAwesomeIcon icon={icons.faIdCard} className="text-gray-300" />
            </div>
            <div>
              <p>{mainFilename}</p>
              <p>{simpleSearchLink(entry.type, 'type', entry.type)} {entry.id.substring(0, 7)}</p>
              <p>{entry.duration > 0 && (
                <>{humanizeDuration(entry.duration)}, </>
              )}{entry.width}x{entry.height}</p>
            </div>
          </div>

          {/* Make */}
          <div className="flex">
            <div className="flex-shrink-0 w-8">
              <FontAwesomeIcon icon={icons.faCamera} className="text-gray-300" />
            </div>
            <div>
              {(entry.make || entry.model) && (
                <p>
                  {entry.make && (
                    <>{simpleSearchLink(entry.make, 'make', entry.make)}</>
                  )}
                  {entry.make && entry.model && (
                    <><span className="px-2">/</span></>
                  )}
                  {entry.model && (
                    <>{simpleSearchLink(entry.model, 'model', entry.model)}</>
                  )}
                </p>
              )}
              <p>ISO {entry.iso}, Aperture {entry.aperture}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex">
            <div className="w-8">
              <FontAwesomeIcon icon={icons.faCalendar} className="text-gray-300" />
            </div>
            <div>
              <p>
                {searchLink(formatDate('%d', entry.date), `year:${entry.date.substr(0, 4)} month:${entry.date.substr(5, 2)} day:${entry.date.substr(8, 2)}`)}
                <span className="px-1">.</span>
                {searchLink(formatDate('%m', entry.date), `year:${entry.date.substr(0, 4)} month:${entry.date.substr(5, 2)}`)}
                <span className="px-1">.</span>
                {searchLink(formatDate('%Y', entry.date), `year:${entry.date.substr(0, 4)}`)}
              </p>
              <p>
                {formatDate('%H:%M:%S', entry.date)}
              </p>
            </div>
          </div>

          {/* Path */}
          <div className="flex">
            <div className="flex-shrink-0 w-8">
              <FontAwesomeIcon icon={icons.faFolder} className="text-gray-300" />
            </div>
            <div>
              {entry.files.map(mapFile).map(l => (
                <>
                  <p>{l}</p>
                </>
              ))}
            </div>
          </div>

          {/* Geo */}
          {(hasAddress(entry) || hasGeo(entry)) && (
            <div className="flex">
              <div className="flex-shrink-0 w-8">
                <FontAwesomeIcon icon={icons.faMapPin} className="text-gray-300" />
              </div>
              <div>
                {entry.road && (
                  <p>{simpleSearchLink(entry.road, 'location', entry.road)}</p>
                )}
                {entry.city && (
                  <p>{simpleSearchLink(entry.city, 'city', entry.city)}</p>
                )}
                {entry.country && (
                  <p>{simpleSearchLink(entry.country, 'country', entry.country)}</p>
                )}
                {hasGeo(entry) && (
                  <p className={classNames({ 'mt-2': hasAddress(entry) })}>{GeoLink(entry)}</p>
                )}
              </div>
            </div>
          )}

          {/* Objects */}
          {entry.objects.length > 0 && (
            <div className="flex">
              <div className="flex-shrink-0 w-8">
                <FontAwesomeIcon icon={icons.faShapes} className="text-gray-300" />
              </div>
              <div>
                <p className="inline-flex flex-wrap gap-2">{entry.objects.map(object => (
                  <span>{simpleSearchLink(object.class)} ({object.score})</span>
                ))}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex">
            <div className="flex-shrink-0 w-8">
              <FontAwesomeIcon icon={icons.faTags} className="text-gray-300" />
            </div>
            <div>
              <p className="inline-flex flex-wrap gap-2">

                {/* {entry.tags.map(tag => (
                  <span>{simpleSearchLink(tag, 'tag', tag)}, </span>
                ))} */}

                {entry.tags.map(tag => (
                  <a className="px-2 py-1 text-gray-300 bg-gray-800 rounded hover:bg-gray-700 hover:text-gray-200 hover:cursor-pointer" onClick={() => dispatchSearch(`${queryTerm("tag", tag)}`)} title={`Search for tag: ${tag}`}>{tag}</a>
                ))}
                {!appConfig.disabledEdit && (
                  <a className="flex items-center gap-2 px-2 py-1 text-gray-500 bg-transparent border border-gray-700 rounded group inset-1 hover:bg-gray-700 hover:text-gray-200 hover:cursor-pointer active:bg-gray-600" onClick={editTags} title={`Edit single tags`}>
                    <FontAwesomeIcon icon={icons.faPen} className="text-gray-500 group-hover:text-gray-300" />
                    {/* <span>Edit tags</span> */}
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Faces */}
          {entry.faces.length > 0 && (
            <div className="flex">
              <div className="flex-shrink-0 w-8">
                <FontAwesomeIcon icon={icons.faUser} className="text-gray-300" />
              </div>
              <div>
                <p className="inline-flex flex-wrap gap-2">
                  {/* {entry.faces.map((face, i) => (
                  <span>{selectFace(face.gender, entry.shortId, i)} (~{face.age.toFixed()}y)</span>
                ))} */}

                  {entry.faces.map((face, i) => (
                    <a className="px-2 py-1 text-gray-300 bg-gray-800 rounded hover:bg-gray-700 hover:text-gray-200 hover:cursor-pointer" onClick={() => navigate(`/faces/${entry.shortId}/${i}`)} title={`Search for person: ${face.faceTag}`}>{face.faceTag}</a>
                  ))}

                  {!appConfig.disabledEdit && (
                    <a className="flex items-center gap-2 px-2 py-1 text-gray-500 bg-transparent border border-gray-700 rounded group inset-1 hover:bg-gray-700 hover:text-gray-200 hover:cursor-pointer active:bg-gray-600" onClick={editFaceTags} title={`Edit face tags`}>
                      <FontAwesomeIcon icon={icons.faPen} className="text-gray-500 group-hover:text-gray-300" />
                      {/* <span>Edit tags</span> */}
                    </a>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

