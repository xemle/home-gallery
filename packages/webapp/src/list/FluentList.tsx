import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSingleViewStore } from '../store/single-view-store'
import { useEditModeStore, ViewMode } from '../store/edit-mode-store'
import Hammer from 'hammerjs';

import { useLastLocation } from '../utils/lastLocation/useLastLocation'
import useBodyDimensions from '../utils/useBodyDimensions';
import { VirtualScroll } from "./VirtualScroll";
import { humanizeDuration } from "../utils/format";
import { getHigherPreviewUrl, getWidthFactor } from '../utils/preview';

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
    <div ref={ref} key={id} className={`fluent__cell ${isSelected() ? '-selected' : ''}`} style={style}>
      <img style={style} src={previewUrl} loading="lazy" />
      {type == 'video' &&
        <span className="_detail">
          <i className="fas fa-play pr-4"></i>
          {humanizeDuration(duration)}
        </span>
      }
    </div>
  )
}

const Row = (props) => {
  const style = {
    height: props.height
  }
  const columns = props.columns;
  return (
    <div className='fluent__row' style={style}>
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
    <div className="fluent" style={{width}}>
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={padding} >
        {({row}) => <Row height={row.height} columns={row.columns}></Row>}
      </VirtualScroll>
    </div>
  )
}
