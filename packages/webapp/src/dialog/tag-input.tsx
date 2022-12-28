import React, { FunctionComponent, KeyboardEvent, useState, useRef, useEffect } from "react";

import { Tag } from "../api/models";
import { classNames } from '../utils/class-names'
import { useClientRect } from "../utils/useClientRect";
import { TagSuggestion } from "./tags";

const TagList = ({tags, dispatch}: {tags: Tag[], dispatch}) => {
  return (
    <>
      {tags.map((tag, i) => (
        <span key={`${i}-${tag.name}-${tag.remove}`} className={classNames('tag', '-large', '-button', {'-danger': tag.remove})}>
          <span onClick={() => dispatch({type: 'toggleRemoveFlag', value: tag.name})} title={`Click to ${tag.remove ? 'add tag to media' : 'remove tag from media'}`}><i className={classNames('fas', {'fa-plus': !tag.remove, 'fa-minus': tag.remove})}></i> {tag.name}</span>
          <a onClick={() => dispatch({type: 'removeTag', value: tag.name})}><i className="fas fa-times"></i></a>
        </span>
      ))}
    </>
  )
}


const SuggestionList = ({suggestions, input, dispatch}: {suggestions: TagSuggestion[], input: any, dispatch: Function}) => {
  const [style, setStyle] = useState({})
  const rect = useClientRect(input, 250)

  useEffect(() => {
    if (!rect) {
      return
    }

    setStyle({
      position: 'fixed',
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
      maxHeight: window.innerHeight - rect.bottom - 24
    })
  }, [rect])

  if (!suggestions.length) {
    return (<></>)
  }

  return (
    <div className="-list" style={style}>
      {suggestions.map((item, i) => (
        <div key={`${i}-${item.name}`} className={classNames({'-active': item.active})} onClick={() => dispatch({type: 'addTag', value: item.name})}>{item.name}</div>
      ))}
    </div>
  )
}

export interface TagInputProps {
  value: string
  tags: Tag[]
  suggestions: TagSuggestion[]
  dispatch: Function
}

export const TagInput : FunctionComponent<TagInputProps> = ({value, tags, suggestions, dispatch}) => {

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
    } else if (ev.key == ',') {
      const cursorPos = ev.target.selectionStart || value.length
      const head = value.substring(0, cursorPos).replace(/(^\s+|\s+$)/g, '')
      const tail = value.substring(cursorPos).replace(/(^\s+|\s+$)/g, '')
      if (head) {
        ev.preventDefault()
        return dispatch({type: 'addTag', value: head, tail})
      }
    }
  }

  const handleChange = (ev: KeyboardEvent<HTMLInputElement>) => {
    const value: string = ev.target.value;
    return dispatch({type: 'suggestTag', value})
  }

  return (
    <>
      <div className="autocomplete">
        <div ref={ref} className="input -tag-list">
          <TagList tags={tags} dispatch={dispatch} />
          <input id="tags" ref={input => input && input.focus()} value={value} placeholder='Add tag' onKeyDown={handleKeyDown} onChange={handleChange}/>
        </div>
        <SuggestionList suggestions={suggestions} dispatch={dispatch} input={ref} />
      </div>
   </>
  )
}