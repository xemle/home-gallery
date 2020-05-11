import { useEffect } from "react";

export function useTouch(ref, onTap?) {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let touchCount = 0;
    let startTouch;
    let start;
    let timer;

    const startHandler = e => {
      const touches = e.changedTouches;
      startTouch = touches[0];
      start = Date.now();
    };

    const endHandler = e => {
      const touches = e.changedTouches;
      const touch = touches[0];
      const duration = Date.now() - start;
      const dx = touch.pageX - startTouch.pageX;
      const dy = touch.pageY - startTouch.pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      touchCount++;
      
      timer = setTimeout(() => {
        if (!touchCount) {
          return;
        } 
        
        let touchType;
        if (touchCount > 1) {
          touchType = 'doubleTap';
        } else if (distance > 20) {
          touchType = 'swipe';
        } else if (duration > 250) {
          touchType = 'longTap';
        } else {
          touchType = 'tap';
        }
        touchCount = 0;
        onTap && onTap({touchType, duration, distance, angle});
      }, 200);
    };

    element.addEventListener("touchstart", startHandler);
    element.addEventListener("touchend", endHandler);
    return () => {
      element.removeEventListener("touchstart", startHandler);
      element.removeEventListener("touchend", endHandler);
      clearTimeout(timer);
    };
  }, [ref]);
}
