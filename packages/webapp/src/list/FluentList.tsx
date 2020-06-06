import * as React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';
import { useStoreActions, useStoreState } from '../store/hooks';
import Hammer from 'hammerjs';

import useBodyDimensions from '../utils/useBodyDimensions';
import { fluent } from "./fluent";
import { VirtualScroll } from "./VirtualScroll";
import { ViewMode } from "../store/edit-mode-model";
import { useDeviceType, DeviceType } from "../utils/useDeviceType";

const Cell = ({height, width, index, item, items}) => {
  const ref = useRef();
  const location = useLocation();
  const viewMode = useStoreState(state => state.editMode.viewMode);

  const selectedIdMap = useStoreState(state => state.editMode.selectedIdMap);
  const toggleId = useStoreActions(store => store.editMode.toggleId);
  const toggleRange = useStoreActions(store => store.editMode.toggleRange);
  const {id, previews} = item;
  const style = { height, width }
  const history = useHistory();

  const previewSizes = [1920, 1280, 800, 320, 128];
  const minPreviewSize = previewSizes.filter((size, i) => i == 0 || size >= width).pop();
  const previewName = `-image-preview-${minPreviewSize}.`;
  const preview = previews.filter(preview => preview && preview.indexOf(previewName) >= 0).shift();

  const showImage = () => {
    history.push(`/view/${id}`, {listPathname: location.pathname, index});
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

  const previewUrl = `/files/${preview}`;
  return (
    <div ref={ref} key={id} className={`fluent__cell ${isSelected() ? '-selected' : ''}`} style={style}>
      <img style={style} src={previewUrl} />
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

export const FluentList = (props) => {
  const { width } = useBodyDimensions();
  const [ deviceType ] = useDeviceType();

  const rows = useMemo(() => {
    const rowHeights = deviceType === DeviceType.MOBILE ? {minHeight: 61, maxHeight: 110} : {minHeight: 120, maxHeight: 200 }
    return fluent(props.entries, Object.assign({padding: 8, width}, rowHeights));
  }, [width, props.entries])

  const virtualScrollRef = useRef(null);
  const lastLocation = useLastLocation();
  const idMatch = lastLocation ? lastLocation.pathname.match(/\/([a-z0-9]{40})\b/) : false;

  useLayoutEffect(() => {
    console.log(`MediaFluent:useLayoutEffect idMatch=${idMatch}`)
    if (!idMatch || !rows.length) {
      return;
    }
    const id = idMatch[1];
    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i].columns && rows[i].columns.find(cell => cell.item.id == id);
      if (cell) {
        virtualScrollRef.current.scrollToRow({rowIndex: i});
        break;
      }
    }
  }, [virtualScrollRef, rows])

  return (
    <div className="fluent" style={{width}}>
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={8} >
        {({row}) => <Row height={row.height} columns={row.columns}></Row>}
      </VirtualScroll>
    </div>
  )
}
