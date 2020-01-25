import * as React from "react";
import {useRef, useLayoutEffect} from "react";
import { FixedSizeGrid as Grid } from 'react-window';

import useBodyDimensions from './body-dimensions';
import {Media} from './Media';
import { ErrorBoundary } from './ErrorBoundery';
import { useLastLocation } from 'react-router-last-location';

export interface IMediaGridProps {
  media: any[]
}

const Cell = ({ data, columnIndex, rowIndex, style }) => {
  const index = columnIndex + data.columns * rowIndex;
  if (index >= data.media.length) {
    return (<div style={style}>Empty {index} cI:{columnIndex} cc:{data.columns} r:{rowIndex}</div>)
  } else {
    return (
      <ErrorBoundary>
        <Media media={data.media} index={index} size={data.size} style={style}/>
      </ErrorBoundary>
    )
  }
};

export const MediaGrid = (props: IMediaGridProps) => {
  const { width, height } = useBodyDimensions();

  const defaultMediaWidth = width > 800 ? 240 : 120;
  const fontSize = 12;
  const lineHeight = 1.5;
  const lineCount = 3;
  const descriptionHeight = lineCount * fontSize * lineHeight;
  const defaultMediaHeight = defaultMediaWidth + (defaultMediaWidth === 240 ? descriptionHeight : 0);
  const columns = Math.floor(width / defaultMediaWidth);
  const rows = Math.ceil(props.media.length / columns);
  const data = {columns, media: props.media, size: defaultMediaWidth};

  const gridRef = useRef(null);

  const lastLocation = useLastLocation();

  useLayoutEffect(() => {
    const match = lastLocation ? lastLocation.pathname.match(/\/([a-z0-9]{40})\b/) : false;
    if (match && columns) {
      const lastIndex = props.media.map(m => m.id).indexOf(match[1]);
      const rowIndex = Math.floor(lastIndex / columns);
      gridRef.current.scrollToItem({rowIndex, align: "center"});
    }
  }, [gridRef])

  console.log(`width: ${width}, height: ${height}, defaultMediaWidth: ${defaultMediaWidth}, columns: ${columns}`);

  const style = {
    'paddingTop': '40px'
  }

  return (
    <>
      <Grid
        ref={gridRef}
        columnCount={columns}
        columnWidth={defaultMediaWidth}
        height={height}
        rowCount={rows}
        rowHeight={defaultMediaHeight}
        width={width}
        itemData={data}
        style={style}
      >
        {Cell}
      </Grid>
    </>
  );
}
