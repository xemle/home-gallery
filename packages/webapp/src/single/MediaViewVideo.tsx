import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Hammer from 'hammerjs'

import { getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { classNames } from "../utils/class-names";

export const MediaViewVideo = (props) => {
  const { media, dispatch } = props
  const { previews } = media;
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef()
  const gestureOverlay = useRef()
  const previewSize = usePreviewSize()
  const posterUrl = getHigherPreviewUrl(previews, previewSize) || ''

  const videoPreview = previews.filter(p => p.match(/video-preview/)).shift()
  const videoUrl = videoPreview ? `files/${videoPreview}` : ''
  const videoMime = videoPreview ? `video/${videoPreview.substring(videoPreview.lastIndexOf('.') + 1).toLowerCase()}` : 'video/mp4'

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

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <video ref={ref} controls playsinline poster={posterUrl} className="w-full h-full">
          <source src={videoUrl} type={videoMime} />
          No native video element support. Watch video file from <a href={videoUrl}>here</a>
        </video>
        <div ref={gestureOverlay} className={classNames('absolute top-0 left-0 right-0 bottom-14 md:bottom-18', {'hidden': isPlaying})}></div>
      </div>
    </>
  )
}
