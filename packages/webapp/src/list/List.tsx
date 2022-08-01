import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";

import { useStoreState } from '../store/hooks';

import { FluentList } from "./FluentList";
import { NavBar } from "../navbar/NavBar";
import { Scrollbar } from "./scrollbar";

import useBodyDimensions from '../utils/useBodyDimensions';
import { useDeviceType, DeviceType } from "../utils/useDeviceType";
import { fluent } from "./fluent";

const NAV_HEIGHT = 44
const BOTTOM_MARGIN = 4

const useViewHeight = (offset) => {
  const getHeight = () => (document.documentElement.clientHeight)+ offset
  const [height, setHeight] = useState(getHeight())

  const onResize = () => setHeight(getHeight())

  useEffect(() => {
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}

export const List = () => {
  const entries = useStoreState(state => state.entries.entries);

  const containerRef = useRef(window)

  const { width, height } = useBodyDimensions();
  const [ deviceType ] = useDeviceType();

  const viewHeight = height - NAV_HEIGHT - BOTTOM_MARGIN
  const padding = 8

  const rows = useMemo(() => {
    const rowHeights = deviceType === DeviceType.MOBILE ? {minHeight: 61, maxHeight: 110} : {minHeight: 120, maxHeight: 200 }
    return fluent(entries, {padding, width, ...rowHeights});
  }, [width, entries, deviceType])

  const topDateItems = useMemo(() => {
    return rows.map(({top, height, columns}) => ({top, height, date: columns[0].item?.date || '1970-01-01T00:00:00', dateValue: '1970'}))
  }, [rows])


  return (
    <>
      <NavBar />
      <div style={{paddingTop: NAV_HEIGHT}}>
        <Scrollbar containerRef={containerRef}
          style={{marginTop: NAV_HEIGHT, marginBottom: BOTTOM_MARGIN}}
          pageHeight={viewHeight}
          topDateItems={topDateItems} />
        <FluentList rows={rows} padding={padding} />
      </div>
    </>
  )
}