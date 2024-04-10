import React from 'react';
import { useState, useRef, useLayoutEffect, FunctionComponent } from 'react';
import Hammer from 'hammerjs';
import { useClientRect } from "../utils/useClientRect";

const containsSize = (containerWidth, containerHeight, childWidth, childHeight) => {
  if (!containerWidth) {
    return [childWidth, childHeight]
  }
  const containerRatio = containerWidth / containerHeight
  const childRatio = childWidth / childHeight
  if (containerRatio > childRatio) {
    const childScale = containerHeight / childHeight
    return [childScale * childWidth, containerHeight]
  } else {
    const childScale = containerWidth / childWidth
    return [containerWidth, childScale * childHeight]
  }
}

type ZoomableProps = {
  childWidth: number;
  childHeight: number;
  onSwipe?: (ev: HammerInput) => void;
  children?: React.JSX.Element
}

export const Zoomable: FunctionComponent<ZoomableProps> = ({childWidth, childHeight, onSwipe, children}) => {
  const ref = useRef<HTMLDivElement>();
  const [style, setStyle] = useState({});
  const clientRect = useClientRect(ref);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !clientRect) {
      return;
    }

    let START_X = 0;
    let START_Y = 0;

    let ticking = false;
    let transform;
    let initScale = 1;
    const [childContainsWidth, childContainsHeight] = containsSize(clientRect?.width, clientRect?.height, childWidth, childHeight)

    const logEvent = (ev) => {
      //console.log(`Type ${ev.type}`, ev);
      //el.innerText = ev.type;
    }

    const resetElement = () => {
      transform = {
        translate: { x: 0, y: 0 },
        scale: 1,
      };
      requestElementUpdate();
    }

    const updateElementTransform = () => {
      const scale = Math.min(5, Math.max(1, transform.scale));

      const maxX = Math.max(0, (scale * childContainsWidth - clientRect.width) / 2);
      const maxY = Math.max(0, (scale * childContainsHeight - clientRect.height) / 2);
      const x = Math.min(maxX, Math.max(-maxX, transform.translate.x));
      const y = Math.min(maxY, Math.max(-maxY, transform.translate.y));

      const cssTransform = `translate(${x}px, ${y}px) scale(${scale})`;
      setStyle(style => {
        return {...style, ...{transform: cssTransform}}
      });
      ticking = false;
    }

    const requestElementUpdate = () => {
      if(!ticking) {
        requestAnimationFrame(updateElementTransform);
        ticking = true;
      }
    }

    const onPanHandler = (ev) => {
      if (ev.type == 'panstart') {
        START_X = transform.translate.x;
        START_Y = transform.translate.y;
      }

      transform.translate = {
        x: START_X + ev.deltaX,
        y: START_Y + ev.deltaY
      };

      logEvent(ev);
      requestElementUpdate();
    }

    let onPinchHandler = (ev) => {
      if(ev.type == 'pinchstart') {
        initScale = transform.scale || 1;
      }

      transform.scale = Math.min(5, Math.max(1, initScale * ev.scale));

      logEvent(ev);
      requestElementUpdate();
    }

    const onSwipeHandler = (ev) => {
      logEvent(ev);
      if (transform.scale === 1 && onSwipe) {
        onSwipe(ev);
      }
    }

    const onDoubleTapHandler = (ev) => {
      if (transform.scale > 1.5) {
        resetElement();
      } else {
        transform.scale = 4;
        const deviceCenter = {
          x: childWidth / 2 - ev.center.x,
          y: childHeight / 2 - ev.center.y
        };
        const childOffset = {
          x: (clientRect.width - childWidth) / 2,
          y: (clientRect.height - childHeight) / 2
        };
        const scaleUxOffset = 0.5;
        const scale = transform.scale - scaleUxOffset;
        transform.translate = {
          x: scale * (deviceCenter.x + childOffset.x),
          y: scale * (deviceCenter.y + childOffset.y),
        }
      }
      logEvent(ev);
      requestElementUpdate();
    }

    resetElement();

    const mc = new Hammer.Manager(el);

    mc.add(new Hammer.Pan({ threshold: 0, pointers: 1 }));

    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan')]);

    mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2, interval: 400 }));
    mc.add(new Hammer.Tap());

    mc.on("panstart panmove", onPanHandler);
    mc.on("pinchstart pinchmove", onPinchHandler);
    mc.on("swipe", onSwipeHandler);
    //mc.on("tap", onTap);
    mc.on("doubletap", onDoubleTapHandler);

    mc.on("hammer.input", (ev) => {
      if(ev.isFinal) {
        logEvent(ev);
        //resetElement();
      }
    });

    console.log('init layoutEffect');

    const onWheel = (ev) => {
      if (transform.scale == 1 && !ev.shiftKey) {
        return
      }

      const zoom = ev.wheelDelta < 0 ? 0.8 : 1.2
      transform.scale = Math.min(5, Math.max(1, transform.scale * zoom));

      logEvent(ev);
      requestElementUpdate();
    }

    el.addEventListener('wheel', onWheel)

    const onMouseDown = ev => ev.preventDefault()
    el.addEventListener('mousedown', onMouseDown, false)

    return () => {
      console.log('reset layoutEffect');
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      if (!mc) {
        return;
      }
      mc.stop(false);
      mc.destroy();
    }
  }, [ref, clientRect]);

  return (
    <>
      <div ref={ref} className='relative w-full h-full' style={style}>{children}</div>
    </>
  )
}
