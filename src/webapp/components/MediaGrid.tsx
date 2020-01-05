import * as React from "react";
import { FixedSizeGrid as Grid } from 'react-window';
import useDimensions from 'react-use-dimensions';
import {Media} from './Media';
import { ErrorBoundary } from './ErrorBoundery';

export interface IMediaGridProps {
  media: any[]
}

const Cell = ({ data, columnIndex, rowIndex, style }) => {
  const index = columnIndex + data.columns * rowIndex;
  if (index >= data.media.length) {
    return (<div style={style}>Empty {index} cI:{columnIndex} cc:{data.columns} r:{rowIndex}</div>)
  } else {
    const media = data.media[index];
    return (
      <ErrorBoundary>
        <Media media={media} size={data.size} style={style}/>
      </ErrorBoundary>
    )
  }
};

export const MediaGrid = (props: IMediaGridProps) => {
  const [ref, {top, left, bottom, right} ] = useDimensions();
  const width = right ? right : 1;
  const height = bottom ? bottom - top : 400;
  const defaultMediaWidth = width > 800 ? 240 : 120;
  const fontSize = 12;
  const lineHeight = 1.5;
  const lineCount = 3;
  const descriptionHeight = lineCount * fontSize * lineHeight;
  const defaultMediaHeight = defaultMediaWidth + (defaultMediaWidth === 240 ? descriptionHeight : 0);
  const columns = Math.ceil(width / defaultMediaWidth);
  const rows = Math.ceil(props.media.length / columns);
  const data = {columns, media: props.media, size: defaultMediaWidth};
  console.log(`left: ${left}, right: ${right}, top: ${top}, bottom: ${bottom}, height: ${height}, defaultMediaWidth: ${defaultMediaWidth}, columns: ${columns}`);


  const style = {
    width: '100%',
  }

  return (
    <>
    <div style={style} ref={ref}>
      <Grid 
      columnCount={columns}
      columnWidth={defaultMediaWidth}
      height={height}
      rowCount={rows}
      rowHeight={defaultMediaHeight}
      width={width}
      itemData={data}
    >
      {Cell}
    </Grid>
    </div>
    </>
  );
}