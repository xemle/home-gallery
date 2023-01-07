import React, { FunctionComponent, KeyboardEvent, useRef } from "react";

import { Tag } from "../api/models";
import { classNames } from '../utils/class-names'
import { toKey } from "../utils/toKey";
import { TagSuggestion } from "./suggestion";
import { SuggestionList } from "./suggestion-list";

const TagList = ({tags, withRemove, dispatch}: {tags: Tag[], withRemove: boolean, dispatch}) => {
  return (
    <>
      {tags.map((tag, i) => (
        <span key={toKey(tag)} className={classNames('tag', '-large', {'-button': withRemove, '-danger': tag.remove})}>
          { withRemove &&
            <span onClick={() => dispatch({type: 'toggleRemoveFlag', value: tag.name})} title={`Click to ${tag.remove ? 'add tag to media' : 'remove tag from media'}`}><i className={classNames('fas', {'fa-plus': !tag.remove, 'fa-minus': tag.remove})}></i> {tag.name}</span>
          }
          { !withRemove &&
            <span>{tag.name}</span>
          }
          <a onClick={() => dispatch({type: 'removeTag', value: tag.name})}><i className="fas fa-times"></i></a>
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
      <div className="autocomplete">
        <div ref={ref} className="input -tag-list">
          <TagList tags={tags} withRemove={withRemove} dispatch={dispatch} />
          <input id="tags" ref={input => input && input.focus()} value={value} placeholder='Create or add tag' onKeyDown={handleKeyDown} onChange={handleChange}/>
        </div>
        { showSuggestions &&
          <SuggestionList suggestions={suggestions} dispatch={dispatch} input={ref} />
        }
      </div>
   </>
  )
}
