import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Hammer from 'hammerjs'

export const MediaViewVideo = (props) => {
  const { media, dispatch } = props
  const { previews } = media;
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef()
  const gestureOverlay = useRef()

  useEffect(() => {
    const e: HTMLElement = ref.current;
    if (!e) {
      return
    }

    const onPause = () => {
      setIsPlaying(false)
      dispatch({type: 'pause'})
    }
    const onPlay = () => {
      setIsPlaying(true)
      dispatch({type: 'play'})
    }

    e.addEventListener('pause', onPause)
    e.addEventListener('play', onPlay)

    return () => {
      e.removeEventListener('pause', onPause)
      e.removeEventListener('play', onPlay)
    }
  }, [ref])

  useEffect(() => {
    const video: HTMLMediaElement = ref.current;
    const overlay: HTMLMediaElement = gestureOverlay.current;

    if (!overlay || !video) {
      return
    }

    const onSwipeHandler = (ev) => {
      if (!video.paused) {
        return
      }
      ev.preventDefault()

      if (ev.direction === Hammer.DIRECTION_LEFT) {
        dispatch({type: 'next'})
      } else if (ev.direction === Hammer.DIRECTION_RIGHT) {
        dispatch({type: 'prev'})
      }
    }

    const onTapHandler = (ev) => {
      if (!video.paused) {
        return
      }

      ev.preventDefault()

      setIsPlaying(true)
      video.play()
    }

    const mc = new Hammer.Manager(overlay)
    mc.add(new Hammer.Swipe())
    mc.add(new Hammer.Tap());

    mc.on("swipe", onSwipeHandler)
    mc.on("tap", onTapHandler)

    return () => {
      mc.stop(false)
      mc.destroy()
    }
  }, [ref, gestureOverlay])

  const overlayStyle = {
    display: isPlaying ? 'none' : 'block',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 40,
    right: 0
  }

  return (
    <>
      <div className="mediaView -video">
        <video ref={ref} className="mediaView__media" controls poster={`files/${previews.filter(p => p.match(/image-preview-800/)).shift()}`}>
          <source src={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}  type="video/mp4" />
          No native video element support. Watch video file from <a href={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}>here</a>
        </video>
        <div ref={gestureOverlay} style={overlayStyle}></div>
      </div>
    </>
  )
}
