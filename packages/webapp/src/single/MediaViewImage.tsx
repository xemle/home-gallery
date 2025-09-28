import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";

import { getLowerPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { useClientRect } from '../utils/useClientRect'
import { MediaAnnotations } from "./MediaAnnotations";
import { useAppConfig } from "../config/useAppConfig";

type MediaPreview = {
  size: number
  url: string
  isLoading?: boolean
  isLoaded?: boolean
}

type MediaViewImageState = {
  mediaPreviews: MediaPreview[]
}

export const MediaViewImage = (props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const appConfig = useAppConfig()
  const [state, setState] = useState<MediaViewImageState>({mediaPreviews: []})

  const { media, showAnnotations, zoomFactor = 1 } = props;
  const { previews } = props.media;
  const previewSize = usePreviewSize()
  const smallUrl = getLowerPreviewUrl(previews, previewSize / 4) || ''

  useMediaPreviews(media, appConfig, setState)
  usePreviewLoading(media, imgRef, state, zoomFactor, setState)

  const src = useMemo(() => {
    const url = state.mediaPreviews
      .filter(preview => preview.isLoaded)
      .map(preview => preview.url)
      .pop()
    return url || smallUrl
  }, [state.mediaPreviews])

  return (
    <>
      <div className="relative w-full h-full">
        <img ref={imgRef} className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={smallUrl} />
        <img className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={src} />
        {showAnnotations && <MediaAnnotations media={props.media} imgRef={imgRef} src={src} />}
      </div>
    </>
  )
}

function useMediaPreviews(media, appConfig, setState: React.Dispatch<React.SetStateAction<MediaViewImageState>>) {
  useEffect(() => {
    const mediaPreviews: MediaPreview[] = media.previews.reduce((result: MediaPreview[], url: string) => {
      const match = url.match(/image-preview-(\d+)\./)
      if (!match) {
        return result
      }
      const size = +match[1]
      const hasSize = !!result.find(preview => preview.size == size)
      if (!hasSize) {
        result.push({size: +match[1], url: `files/${url}`})
      }
      return result
    }, [] as MediaPreview[])

    const downloadableIndices = appConfig.sources?.filter(s => s.downloadable).map(s => s.indexName) || []
    if (downloadableIndices.length) {
      const file = media.files.find(file => file.type == 'image' && downloadableIndices.includes(file.index))
      if (file) {
        const size = Math.max(media.height, media.width)
        mediaPreviews.push({size, url: `sources/${file.index}/${file.filename}`})
      }
    }

    mediaPreviews.sort((a, b) => a.size - b.size)
    setState(prev => ({...prev, mediaPreviews}))
  }, [media, appConfig])
}

function usePreviewLoading(media, imgRef, state: MediaViewImageState, zoomFactor, setState: React.Dispatch<React.SetStateAction<MediaViewImageState>>) {
  const imgRect = useClientRect(imgRef);

  useEffect(() => {
    if (!state.mediaPreviews.length || !imgRect || !media.height || !media.width) {
      return
    }

    const {width: mediaWidth, height: mediaHeight} = media
    const {width: rectWidth, height: rectHeight} = imgRect

    const rectRatio = rectWidth / rectHeight
    const mediaRatio = mediaWidth / mediaHeight

    let rectScale: number // scale factor for image to fit into rect
    if (rectRatio > mediaRatio) {
      rectScale = rectHeight / mediaHeight
    } else {
      rectScale = rectWidth / mediaWidth
    }

    const scale = rectScale * zoomFactor * (window.devicePixelRatio || 1)
    let requiredSize: number
    if (mediaRatio > 1) { // landscape
      requiredSize = media.width * scale
    } else { // portrait
      requiredSize = media.height * scale
    }

    let index = state.mediaPreviews.findIndex(preview => preview.size >= requiredSize)
    if (index < 0) {
      index = state.mediaPreviews.length - 1
    }

    const preview = state.mediaPreviews[index]
    if (preview.isLoading || preview.isLoaded) {
      return
    }

    function updatePreviewState(url: string, isLoading: boolean, isLoaded: boolean) {
      setState(prev => {
        const index = prev.mediaPreviews.findIndex(preview => preview.url == url)
        const preview = prev.mediaPreviews[index]
        if (index < 0) {
          return prev
        }

        const mediaPreviews = [...prev.mediaPreviews]
        mediaPreviews.splice(index, 1, {...preview, isLoading, isLoaded})
        return {
          ...prev,
          mediaPreviews
        }
      });
    }

    updatePreviewState(preview.url, true, false)

    const img = new Image();
    img.onload = () => updatePreviewState(preview.url, false, true)
    img.src = preview.url

  }, [imgRect, state.mediaPreviews, zoomFactor]);

}
