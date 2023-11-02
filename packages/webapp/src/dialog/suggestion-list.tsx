import * as React from "react";
import { useState, useRef, useEffect } from "react";

import { classNames } from "../utils/class-names";
import { toKey } from "../utils/toKey";
import { useClientRect } from "../utils/useClientRect";
import { TagSuggestion } from "./suggestion";

export const SuggestionList = ({suggestions, input, dispatch}: {suggestions: TagSuggestion[], input: any, dispatch: Function}) => {
  const [style, setStyle] = useState({})
  const rect = useClientRect(input, 250)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rect) {
      return
    }

    setStyle({
      position: 'fixed',
      //top: rect.bottom,
      //left: rect.left,
      width: rect.width,
      maxHeight: window.innerHeight - rect.bottom - 24
    })
  }, [rect])

  const activeSuggetion = React.useMemo(() => suggestions.find(suggestion => suggestion.active), [suggestions])

  useEffect(() => {
    const list = listRef.current
    if (!list) {
      return
    }

    const active = list.querySelector('.active')
    if (!active) {
      return
    }

    const { top, bottom } = list.getBoundingClientRect()
    const { top: itemTop, bottom: itemBottom } = active.getBoundingClientRect()

    if (itemBottom > bottom) {
      list.scrollTo({top: list.scrollTop + (itemBottom - bottom), behavior: 'smooth'})
    } else if (itemTop < top) {
      list.scrollTo({top: list.scrollTop - (top - itemTop), behavior: 'smooth'})
    }
  }, [activeSuggetion])

  if (!suggestions.length) {
    return (<></>)
  }

  return (
    <div className="z-30 flex flex-col bg-gray-800 border border-gray-300 rounded rounded-t-none" style={style} ref={listRef}>
      {suggestions.map((item) => (
        <div key={toKey(item)} className={classNames('text-gray-300 px-4 py-2 hover:bg-gray-600 hover:cursor-pointer', {'bg-gray-700 active': item.active})} onClick={() => dispatch({type: 'addTag', value: item.name})}>
          {item.parts.map(part => part.isMatch ? (<em key={toKey(part)} className="not-italic underline">{part.text}</em>) : part.text)}
        </div>
      ))}
    </div>
  )
}