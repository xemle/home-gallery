import * as React from "react";
import { useLayoutEffect, useRef, useMemo } from "react";
import { useLocation, useHistory } from "react-router-dom";
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
  const history = useHistory();

  const widthFactor = getWidthFactor(width, height);
  const previewUrl = getHigherPreviewUrl(previews, width * widthFactor);

  const showImage = () => {
    history.push(`/view/${shortId}`, {listLocation: location, index});
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

export const FluentList = ({rows, padding}) => {
  const { width } = useBodyDimensions();

  const viewMode = useEditModeStore(state => state.viewMode);
  const lastSelectedId = useEditModeStore(state => state.lastSelectedId);

  const virtualScrollRef = useRef(null);
  const lastLocation = useLastLocation();

  const lastSingleViewId = useMemo(() => {
    const match = lastLocation?.pathname.match(/\/([a-z0-9]{7,})\b/)
    return match ? match[1] : false
  }, [lastLocation])

  useLayoutEffect(() => {
    const id = viewMode == ViewMode.EDIT && lastSelectedId ? lastSelectedId : lastSingleViewId;
    if (!id || !rows.length) {
      return
    }
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i].columns && rows[i].columns.find(cell => cell.item.id.startsWith(id));
      if (cell) {
        console.log(`MediaFluent:useLayoutEffect scroll to ${id}`)
        virtualScrollRef.current.scrollToRow({rowIndex: i});
        break;
      }
    }
    console.log(`MediaFluent:useLayoutEffect could not find entry with ${id}`)
  }, [virtualScrollRef, rows])

  return (
    <div className="fluent" style={{width}}>
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={padding} >
        {({row}) => <Row height={row.height} columns={row.columns}></Row>}
      </VirtualScroll>
    </div>
  )
}
