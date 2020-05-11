import * as React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';

import useBodyDimensions from '../utils/useBodyDimensions';
import { useTouch } from '../utils/useTouch';
import { fluent } from "./fluent";
import { VirtualScroll } from "./VirtualScroll";

const Cell = (props) => {
  const location = useLocation();
  const {height, width, index, item} = props;
  const ref = useRef();
  const {id, previews} = item;
  const linkState = {
    uppathname: location.pathname,
    index
  }  
  const style = { height, width }
  const history = useHistory();

  const previewSizes = [1920, 1280, 800, 320, 128];
  const minPreviewSize = previewSizes.filter((size, i) => i == 0 || size >= width).pop();
  const previewName = `-image-preview-${minPreviewSize}.`;
  const preview = previews.filter(preview => preview && preview.indexOf(previewName) >= 0).shift();

  const showImage = () => {
    history.push(`/view/${id}`, linkState);
  }

  const tapHandler = ({touchType}) => {
    if (touchType === 'tap') {
      showImage();
    }
  }

  useTouch(ref, tapHandler);

  const previewUrl = `/files/${preview}`;
  return (
    <div key={id} className='fluent__cell' style={style} ref={ref} onClick={showImage}>
      {/* <Link to={{pathname:`/view/${id}`, state: linkState}}>
          <img style={style} src={previewUrl} />
      </Link> */}
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
  
  const rows = useMemo(() => {
    const rowHeights = width < 1280 ? {minHeight: 61, maxHeight: 110} : {minHeight: 120, maxHeight: 200 }
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
