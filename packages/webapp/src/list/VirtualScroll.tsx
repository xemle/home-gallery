import * as React from "react";
import {useRef, useEffect, useLayoutEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react";

import { throttle } from '../utils/throttle';

export const useScrollTop = () => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const scroll = () => {
      if (!ref.current) {
        ref.current = requestAnimationFrame(() => {
          ref.current = null;
          setScrollTop(document.documentElement.scrollTop);
        })
      }
    }
    window.addEventListener('scroll', scroll)
    return () => window.removeEventListener('scroll', scroll)
  }, []);

  return [scrollTop, setScrollTop];
}

export const useHeight = () => {
  const getHeight = () => window.innerHeight

  const [height, setHeight] = useState(getHeight());

  useLayoutEffect(() => {
    const updateHeight = () => {
      setHeight(getHeight())
    }
    setHeight(getHeight())
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight);
  }, [])

  return height;
}

export const useScrolling = () => {
  const [scrolling, setScrolling] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const scroll = (e) => {
      if (!ref.current) {
        setScrolling(true);
      } else {
        clearTimeout(ref.current);
      }
      ref.current = setTimeout(() => {
        setScrolling(false)
        ref.current = null;
      }, 200)
    }
    window.addEventListener('scroll', scroll)
    return () => window.removeEventListener('scroll', scroll)
  }, [])

  return scrolling;
}

export const useScrollSpeed = () => {
  const height = useHeight();
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const timerRef = useRef(null);
  const delay = 200;
  const timeout = 100;

  let lastScrollTop = document.documentElement.scrollTop;

  useEffect(() => {
    const scroll = throttle(() => {
      const scrollTop = document.documentElement.scrollTop;
      if (lastScrollTop != scrollTop) {
        const speed = (1000 / delay) * (scrollTop - lastScrollTop) / height;
        setScrollSpeed(+speed.toFixed(2));
      }
      lastScrollTop = scrollTop;

      if (timerRef.current) {
        clearTimeout(ref.current);
      }
      timerRef.current = setTimeout(() => {
        setScrollSpeed(0);
        timerRef.current = null;
      }, timeout);
    }, delay);
    window.addEventListener('scroll', scroll)
    return () => window.removeEventListener('scroll', scroll)
  }, [])

  return scrollSpeed;
}

interface IVirtualScrollRow {
  top: number;
  height: number;
}

const binarySearch = (items: IVirtualScrollRow[], low: number, high: number, value: number) => {
  if (high - low < 2) {
    return low;
  }
  const mid = Math.floor(low + (high - low) / 2);
  if (items[mid].top > value) {
    return binarySearch(items, low, mid, value)
  }
  return binarySearch(items, mid, high, value);
}

export const VirtualScroll = forwardRef((props, ref) => {
  const {items, padding, children} = props;
  const [scrollTop, setScrollTop] = useScrollTop();
  const height = useHeight();
  const scrollSpeed = useScrollSpeed();

  const rowHeights: IVirtualScrollRow[] = useMemo(() => {
    let top = 0;
    return items.map(item => {
      const lastTop = top;
      top += item.height + padding;
      return Object.assign(item, { top: lastTop })
    })
  }, [height, items])

  const {start, end } = useMemo(() => {
    const start = binarySearch(rowHeights, 0, items.length, scrollTop);
    let end = start;
    while (end < items.length && rowHeights[end].top < scrollTop + height) {
      end++;
    }
    return {start, end}
  }, [items, scrollTop])

  const renderItems = useMemo(() => {
    const result = [];
    for (let index = Math.max(0, start - 2); index < Math.min(end + 5, items.length); index++) {
      const row = rowHeights[index];
      const style = {
        position: 'absolute',
        top: row.top,
        height: row.height
      }
      result.push(<div className="item" key={index} style={style}>{children({row, index, scrollSpeed})}</div>)
    }
    return result;
  }, [start, end, items]);

  const lastRow = rowHeights[rowHeights.length - 1];
  const style = {
    position: 'relative',
    height: `${lastRow ? lastRow.top + lastRow.height : 0}px`
  } as React.CSSProperties;

  useImperativeHandle(ref, () => ({
    scrollToRow: ({rowIndex}) => {
      if (!rowHeights.length || rowIndex < 0) {
        return;
      }
      const index = Math.min(rowIndex, rowHeights.length);
      const row = rowHeights[index];
      const scrollToY = row.top + (row.height / 2) - (height / 2);
      console.log(`scrollToRow() to row ${rowIndex} (${index}) with scrollToY ${scrollToY}`);
      window.scrollTo(0, Math.max(0, scrollToY));
      setScrollTop(scrollToY);
    }
  }));

  return (
    <div style={style}>
      {renderItems}
    </div>
  )
})
