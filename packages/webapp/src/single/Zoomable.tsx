import React from 'react';
import { useState, useRef, useLayoutEffect, FunctionComponent } from 'react';
import Hammer from 'hammerjs';

type ZoomableProps = {
  width: number;
  height: number;
  onSwipe?: (ev: HammerInput) => void
}

export const Zoomable: FunctionComponent<ZoomableProps> = ({width, height, onSwipe, children}) => {
  const ref = useRef<HTMLDivElement>();
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    let START_X = 0;
    let START_Y = 0;

    let ticking = false;
    let transform;
    let initScale = 1;

    const logEvent = (ev) => {
      //console.log(ev);
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

      const maxX = (scale * width - width) / 2;
      const maxY = (scale * height - height) / 2;
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
      resetElement();
      logEvent(ev);
      requestElementUpdate();
    }

    resetElement();

    const mc = new Hammer.Manager(el);

    mc.add(new Hammer.Pan({ threshold: 0, pointers: 1 }));

    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan')]);

    mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
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

    return () => {
      console.log('reset layoutEffect');
      if (!mc) {
        return;
      }
      mc.stop(false);
      mc.destroy();
    }
  }, [ref]);

  return (
    <>
      <div ref={ref} className='zoomable' style={style}>{children}</div>
    </>
  )
}
