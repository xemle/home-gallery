import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSingleViewStore } from '../store/single-view-store'
import { useEditModeStore, ViewMode } from '../store/edit-mode-store'
import Hammer from 'hammerjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'

import { useLastLocation } from '../utils/lastLocation/useLastLocation'
import useBodyDimensions from '../utils/useBodyDimensions';
import { VirtualScroll } from "./VirtualScroll";
import { humanizeDuration } from "../utils/format";
import { getHigherPreviewUrl, getWidthFactor } from '../utils/preview';
import { classNames } from '../utils/class-names'

const Cell = ({height, width, index, item, items}) => {
  const ref = useRef();
  const location = useLocation();
  const viewMode = useEditModeStore(state => state.viewMode);

  const selectedIdMap = useEditModeStore(state => state.selectedIds);
  const toggleId = useEditModeStore(store => store.toggleId);
  const toggleRange = useEditModeStore(store => store.toggleRange);
  const {id, shortId, previews, vibrantColors, type, duration } = item;
  const style = { height, width, backgroundColor: (vibrantColors && vibrantColors[1]) || 'inherited' }
  const navigate = useNavigate();

  const widthFactor = getWidthFactor(width, height);
  const previewUrl = getHigherPreviewUrl(previews, width * widthFactor * (window.devicePixelRatio || 1));

  const showImage = () => {
    navigate(`/view/${shortId}`, {state: {listLocation: location, index}});
  }

  const onClick = (selectRange) => {
    if (viewMode === ViewMode.EDIT) {
      if (selectRange) {
        toggleRange(id);
      } else {
        toggleId(id);
      }
    } else {
      showImage();
    }
  }

  const isSelected = () => {
    return viewMode === ViewMode.EDIT && selectedIdMap[id];
  }

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const hammer = new Hammer(element);
    let scrollYStart = 0;

    hammer.on('hammer.input', (e) => {
      if (e.isFirst) {
        scrollYStart = window.scrollY;
      }
    })
    hammer.on('tap press', (e) => {
      const scrollYDiff = Math.abs(scrollYStart - window.scrollY);
      if (scrollYDiff < 10) {
        const selectRange = (e.pointerType === "mouse" && e.srcEvent.shiftKey) || e.type === 'press';
        onClick(selectRange);
      }
    });

    return () => {
      if (!hammer) {
        return;
      }
      hammer.stop(false);
      hammer.destroy();
    }
  });

  return (
    <div ref={ref} key={id} className={classNames('relative group', {'outline outline-4 outline-primary-300 outline-offset-[-0.25rem] brightness-110 saturate-[1.3]': isSelected()})} style={style}>
      <img className={classNames('object-cover')} style={style} src={previewUrl} loading="lazy" />
      {type == 'video' &&
        <span className="absolute flex flex-row items-center gap-2 px-2 text-sm text-gray-100 bg-gray-900 rounded bottom-2 right-2 lg:bg-gray-900/60 group-hover:bg-gray-900">
          <FontAwesomeIcon icon={faPlay} size="sm"/>
          {humanizeDuration(duration)}
        </span>
      }
    </div>
  )
}

const Row = (props) => {
  const style = {
    gap: '8px',
    padding: '4px',
    height: props.height
  }
  const columns = props.columns;
  return (
    <div className="flex w-full item-center" style={style}>
      {columns.map((cell, index) => <Cell key={index} width={cell.width} height={cell.height} item={cell.item} index={cell.index} items={cell.items} />)}
    </div>
  )
}

const findCellById = (rows, id) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cell = rows[rowIndex]?.columns?.find(cell => cell.item.id.startsWith(id));
    if (cell) {
      return [cell, rowIndex]
    }
  }
  return [null, -1]
}

export const FluentList = ({rows, padding}) => {
  const { width } = useBodyDimensions();

  const lastViewId = useSingleViewStore(state => state.lastId);
  const [lastRowIndex, setLastRowIndex] = useState(-1)

  const virtualScrollRef = useRef(null);

  useLayoutEffect(() => {
    if (!lastViewId) {
      return
    }
    const [cell, rowIndex] = findCellById(rows, lastViewId)
    if (cell && lastRowIndex != rowIndex) {
      console.log(`MediaFluent:useLayoutEffect scroll to ${lastViewId} in row ${rowIndex}`)
      virtualScrollRef.current.scrollToRow({rowIndex});
      setLastRowIndex(rowIndex)
    } else if (!cell) {
      console.log(`MediaFluent:useLayoutEffect could not find entry with ${lastViewId}`)
    }
  }, [virtualScrollRef, rows, lastViewId])

  return (
    <div className="relative w-full">
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={padding} >
        {({row}) => <Row height={row.height} columns={row.columns}></Row>}
      </VirtualScroll>
    </div>
  )
}
