import * as React from "react"
import { useState, useRef, useEffect, Dispatch } from "react"
import { ScrollbarActions } from "./state"
import { useClientHeight } from "./useClientRect"

import { useMouseDragging, useTouchDragging} from './useDragging'

const Icon = ({icon, onClick}) => {
  const ref = useRef(null)

  let start
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
  const handleRef = useRef()
  const thumbRef = useRef()

  const mouseDrag = useMouseDragging(thumbRef)
  const touchDrag = useTouchDragging(thumbRef)

  const handleUpClick = () => dispatch({type: 'pageUp'})
  const handleDownClick = () => dispatch({type: 'pageDown'})

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
      <div className={`scrollbar_handle ${visibleToClass[visible] || ''}`} ref={handleRef} style={{top: top}}>
        {detailText && <div className={`scrollbar_detail ${showDetail ? '' : '-hidden'}`}>{detailText}</div>}
        <div className="scrollbar_thumb" ref={thumbRef} >
          <Icon icon='fa-chevron-up' onClick={handleUpClick} />
          <Icon icon='fa-chevron-down' onClick={handleDownClick} />
        </div>
      </div>
    </>
  )
}