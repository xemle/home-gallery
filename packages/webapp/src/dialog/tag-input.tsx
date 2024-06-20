import React, { FunctionComponent, KeyboardEvent, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { Tag } from "../api/models";
import { classNames } from '../utils/class-names'
import { toKey } from "../utils/toKey";
import { TagSuggestion } from "./tag-suggestion";
import { SuggestionList } from "./suggestion-list";

const TagList = ({tags, withRemove, dispatch}: {tags: Tag[], withRemove: boolean, dispatch}) => {
  return (
    <>
      {tags.map((tag, i) => (
        <span key={toKey(tag)} className={classNames('flex items-center align-middle rounded overflow-auto text-gray-300', {'cursor-pointer': withRemove, 'bg-danger-600 hover:bg-danger-500': tag.remove, 'bg-gray-700 ': !tag.remove, 'hover:bg-gray-600': !tag.remove && withRemove})}>
          { withRemove && (
            <>
              <span className="flex items-center justify-center px-2 py-1 pr-0">
                <FontAwesomeIcon icon={tag.remove ? icons.faMinus : icons.faPlus} />
              </span>
              <span className="px-2 py-1 pr-1" onClick={() => dispatch({ type: 'toggleRemoveFlag', value: tag.name })} title={`Click to ${tag.remove ? 'add tag to media' : 'remove tag from media'}`}>{tag.name}</span>
            </>
          )}
          { !withRemove && (
            <span className="px-2 py-1 pr-1">{tag.name}</span>
          )}
          <a className={classNames('px-2 py-1 hover:cursor-pointer group', {'hover:bg-gray-700': withRemove && !tag.remove, 'hover:bg-gray-600': !withRemove && !tag.remove, 'hover:bg-danger-600': tag.remove})} onClick={() => dispatch({type: 'removeTag', value: tag.name})}>
            <FontAwesomeIcon icon={icons.faTimes} className={classNames({' hover:text-gray-100': !tag.remove})}/>
          </a>
        </span>
      ))}
    </>
  )
}

export interface TagInputProps {
  value: string
  tags: Tag[]
  withRemove: boolean
  suggestions: TagSuggestion[]
  showSuggestions: boolean
  dispatch: Function
}

export const TagInput : FunctionComponent<TagInputProps> = ({value, tags, withRemove: withRemove, suggestions, showSuggestions, dispatch}) => {
  const ref = useRef<HTMLElement>(null)

  const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    let value: string = ev.currentTarget.value;
    if (ev.key == 'Enter') {
      value = value.replace(/(^\s+|\s+$)/g, '')
      const activeSuggestion = suggestions.find(suggestion => suggestion.active)
      if (activeSuggestion) {
        const prefix = value.startsWith('-') ? '-' : ''
        value = `${prefix}${activeSuggestion.name}`
      }
      if (value.length) {
        ev.preventDefault()
        return dispatch({type: 'addTag', value})
      }
    } else if (ev.key == 'Backspace' && value.length == 0) {
      return dispatch({type: 'removeLastTag'})
    } else if (ev.key == 'Escape') {
      return dispatch({type: 'clearSuggentions'})
    } else if (ev.key == 'ArrowDown') {
      ev.preventDefault()
      return dispatch({type: 'nextSuggestion'})
    } else if (ev.key == 'ArrowUp') {
      ev.preventDefault()
      return dispatch({type: 'prevSuggestion'})
    }
  }

  const handleChange = (ev: KeyboardEvent<HTMLInputElement>) => {
    const value: string = ev.target.value
    const commaPos = value.indexOf(',', 1)
    if (commaPos < 0) {
      return dispatch({type: 'suggestTag', value})
    } else {
      const head = value.substring(0, commaPos).replace(/(^\s+|\s+$)/g, '')
      const tail = value.substring(commaPos + 1).replace(/(^\s+|\s+$)/g, '')
      if (head) {
        return dispatch({type: 'addTag', value: head, tail})
      } else if (tail) {
        return dispatch({type: 'suggestTag', value: tail})
      }
    }
  }

  return (
    <>
      <div className="relative">
        <div ref={ref} className="flex flex-row flex-wrap items-center justify-start w-full gap-2 px-2 py-1 bg-gray-800 border rounded border-bg-gray-700">
          <TagList tags={tags} withRemove={withRemove} dispatch={dispatch} />
          <input className="flex-1 py-1 text-gray-300 bg-transparent border-0 focus:border-transparent focus:ring-0 focus:outline-none" id="tags" ref={input => input && input.focus()} value={value} placeholder='Create or add tag' onKeyDown={handleKeyDown} onChange={handleChange}/>
        </div>
        { showSuggestions &&
          <SuggestionList suggestions={suggestions} dispatch={dispatch} input={ref} />
        }
      </div>
   </>
  )
}
