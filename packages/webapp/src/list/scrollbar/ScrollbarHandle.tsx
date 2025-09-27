import * as React from "react"
import { useState, useRef, useEffect, type Dispatch } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { type ScrollbarActions } from "./state"
import { useClientHeight } from "./useClientHeight"

import { useMouseDragging, useTouchDragging} from './useDragging'
import { classNames } from "../../utils/class-names"
import { useClick } from "./useClick"

const Icon = ({icon, onClick}) => {
  const ref = useRef<HTMLElement>(null)

  let start: number
  const handleDown = () => {
    start = Date.now()
  }

  const handleUp = e => {
    if (Date.now() - start < 300) {
      onClick(e)
    }
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const e = ref.current
    e.addEventListener('mousedown', handleDown)
    e.addEventListener('mouseup', handleUp)
    e.addEventListener('touchdown', handleDown)
    e.addEventListener('touchup', handleUp)

    return () => {
      e.removeEventListener('mousedown', handleDown)
      e.removeEventListener('mouseup', handleUp)
      e.removeEventListener('touchdown', handleDown)
      e.removeEventListener('touchup', handleUp)
      }
  }, [ref])

  return (
    <i className={`fas ${icon}`} ref={ref}></i>
  )
}

type ScrollbarHandleVisibility = 'full' | 'partial' | 'hidden'
export interface ScrollbarHandleProps {
  dispatch: Dispatch<ScrollbarActions>,
  top: number,
  visible: ScrollbarHandleVisibility,
  detailText: string,
  showDetail: boolean
}

export const ScrollbarHandle = ({dispatch, top, visible, detailText, showDetail}: ScrollbarHandleProps) => {
  const handleRef = useRef<HTMLElement>(null)
  const thumbRef = useRef<HTMLElement>(null)
  const upButton = useRef<HTMLElement>(null)
  const downButton = useRef<HTMLElement>(null)

  const mouseDrag = useMouseDragging(handleRef)
  const touchDrag = useTouchDragging(handleRef)

  useClick(upButton, () => dispatch({type: 'pageUp'}))
  useClick(downButton, () => dispatch({type: 'pageDown'}))

  useEffect(() => dispatch({type: 'handleDragging', ...mouseDrag}), [mouseDrag])
  useEffect(() => dispatch({type: 'handleDragging', ...touchDrag}), [touchDrag])

  const handleHeight = useClientHeight(handleRef)
  useEffect(() => dispatch({type: 'handleHeight', handleHeight}), [handleHeight])

  const visibleToClass = {
    full: '',
    partial: '-partial',
    hidden: '-hidden'
  }

  return (
    <>
      <div className={classNames('absolute right-0 mr-1 flex gap-2 items-center justify-center hover:cursor-pointer', {hidden: !visible})} ref={handleRef} style={{top: top}}>
        {detailText && showDetail && <div className={classNames('bg-gray-800/90 px-4 py-2 rounded text-gray-300')}>{detailText}</div>}
        <div className="flex flex-col gap-1 bg-gray-800 rounded" ref={thumbRef} >
          <span ref={upButton} className="px-2 py-1 group hover:bg-gray-700 hover:text-gray-300">
            <FontAwesomeIcon icon={icons.faChevronUp} className="text-gray-500 group-hover:text-gray-300"/>
          </span>
          <span ref={downButton} className="px-2 py-1 group hover:bg-gray-700 hover:text-gray-300">
            <FontAwesomeIcon icon={icons.faChevronDown} className="text-gray-500 group-hover:text-gray-300" />
          </span>
        </div>
      </div>
    </>
  )
}