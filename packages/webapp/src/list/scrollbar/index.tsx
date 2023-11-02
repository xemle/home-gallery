import * as React from "react";
import { useReducer, useEffect, useState } from "react"

import { useScrollTop } from './useScrollTop'
import { ScrollbarHandle } from './ScrollbarHandle'
import { ScrollbarOverview } from './ScrollbarOverview'
import { useScrollPageSpeedSimple, SimplePageSpeed } from './useScrollPageSpeed'

import { initialState, reducer, ScrollbarActions, ScrollbarOverviewItem, ScrollbarState, VisibleHandle } from './state'
import { overviewItemMapper, TopDateItem } from "./overviewItemMapper";

export interface ScrollbarProps {
  containerRef: React.RefObject<any>,
  style: React.CSSProperties,
  pageHeight: number,
  topDateItems: TopDateItem[]
}

export const Scrollbar = ({containerRef, style, pageHeight, topDateItems}: ScrollbarProps) => {
  const propState = {containerRef, pageHeight}

  const scrollTop = useScrollTop(containerRef)
  const [scrollSpeed, setScrollViewHeight] = useScrollPageSpeedSimple(containerRef, pageHeight)

  const [state, dispatch]: [ScrollbarState, React.Dispatch<ScrollbarActions>] = useReducer(reducer, {...initialState, ...propState})

  const { showOverview, visibleHandle, handleTop, handleDetailText, showHandleDetail, handleHeight, overviewItems, isDragging } = state

  useEffect(() => dispatch({type: 'pageHeight', pageHeight}), [pageHeight])

  useEffect(() => {
    const [overviewItems, detailTextFn] = overviewItemMapper(topDateItems, pageHeight, handleHeight / 2)
    dispatch({type: 'overviewItems', overviewItems, detailTextFn})
  }, [topDateItems, pageHeight, handleHeight])

  useEffect(() => dispatch({type: 'scrollTo', scrollTop}), [scrollTop])

  useEffect(() => setScrollViewHeight(pageHeight), [pageHeight])

  useEffect(() => {
    let visibleHandle: VisibleHandle = 'hidden'
    if (scrollSpeed >= SimplePageSpeed.MEDIUM || isDragging || showOverview) {
      visibleHandle = 'full'
    } else if (scrollSpeed != SimplePageSpeed.NONE) {
      visibleHandle = 'partial'
    }
    dispatch({type: 'showHandle', visibleHandle})
  }, [scrollSpeed, showOverview, isDragging])

  useEffect(() => {
    if (!showOverview && isDragging && scrollSpeed > SimplePageSpeed.SLOW) {
      dispatch({type: 'showOverview', showOverview: true})
    } else if (showOverview && !isDragging && scrollSpeed == SimplePageSpeed.NONE) {
      dispatch({type: 'showOverview', showOverview: false})
    }
  }, [scrollSpeed, showOverview, isDragging])

  useEffect(() => {
    if (!showHandleDetail && scrollSpeed > SimplePageSpeed.MEDIUM) {
      dispatch({type: 'showHandleDetail', showHandleDetail: true})
    } else if (showHandleDetail && scrollSpeed < SimplePageSpeed.SLOW) {
      dispatch({type: 'showHandleDetail', showHandleDetail: false})
    }
  }, [scrollSpeed])

  return (
    <>
      <div className="fixed bottom-0 right-0 z-10 top-12 bg-gray-900/80" style={style}>
        {overviewItems.length > 0 && <ScrollbarOverview overviewItems={overviewItems} show={showOverview} />}
        <ScrollbarHandle dispatch={dispatch} top={handleTop} visible={visibleHandle} detailText={handleDetailText} showDetail={showHandleDetail}/>
      </div>
    </>
  )
}