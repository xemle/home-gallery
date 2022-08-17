import * as React from "react";
import { useRef, useEffect } from "react";

export const MediaViewVideo = (props) => {
  const { media, dispatch } = props
  const { previews } = media;
  const ref = useRef()

  useEffect(() => {
    const e: HTMLElement = ref.current;
    if (!e) {
      return
    }

    const onPause = () => dispatch({type: 'pause'})
    const onPlay = () => dispatch({type: 'play'})

    e.addEventListener('pause', onPause)
    e.addEventListener('play', onPlay)

    return () => {
      e.removeEventListener('pause', onPause)
      e.removeEventListener('play', onPlay)
    }
  }, [ref])

  return (
    <>
      <div className="mediaView -video">
        <video ref={ref} className="mediaView__media" controls poster={`files/${previews.filter(p => p.match(/image-preview-800/)).shift()}`}>
          <source src={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}  type="video/mp4" />
          No native video element support. Watch video file from <a href={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}>here</a>
        </video>
      </div>
    </>
  )
}
