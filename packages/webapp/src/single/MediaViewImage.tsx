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
}

export const MediaViewImage = (props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const appConfig = useAppConfig()

  const { media, prev, next, showAnnotations, zoomFactor = 1 } = props;
  const { previews } = props.media;
  const previewSize = usePreviewSize()
  const smallUrl = getLowerPreviewUrl(previews, previewSize / 4) || ''

  const downloadableIndices = useMemo(() => {
    const indices = appConfig.sources?.filter(s => s.downloadable && s.indexName).map(s => s.indexName) || []
    return indices as string[]
  }, [appConfig])

  const imgRect = useClientRect(imgRef);
  const src = useZoomableSrc(imgRect, media, downloadableIndices, zoomFactor, smallUrl)
  usePrevNextLoading(prev, next, imgRect)

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

function getMediaPreviews(media, downloadableIndices: string[] = []) {
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

  if (downloadableIndices.length) {
    const file = media.files.find(file => file.type == 'image' && downloadableIndices.includes(file.index))
    if (file) {
      const size = Math.max(media.height, media.width)
      mediaPreviews.push({size, url: `sources/${file.index}/${file.filename}`})
    }
  }

  mediaPreviews.sort((a, b) => a.size - b.size)
  return mediaPreviews
}

function getRequiredSize(rect: {width: number, height: number}, media: {width: number, height: number}, zoomFactor: number = 1) {
  const rectRatio = rect.width / rect.height
  const mediaRatio = media.width / media.height

  let rectScale: number // scale factor for image to fit into rect
  if (rectRatio > mediaRatio) {
    rectScale = rect.height / media.height
  } else {
    rectScale = rect.width / media.width
  }

  const scale = rectScale * zoomFactor * (window.devicePixelRatio || 1)
  let requiredSize: number
  if (mediaRatio > 1) { // landscape
    requiredSize = media.width * scale
  } else { // portrait
    requiredSize = media.height * scale
  }

  return requiredSize
}

function useZoomableSrc(imgRect: DOMRect | null, media: any, downloadableIndices: string[], zoomFactor, initialSrc: string) {
  const [src, setSrc] = useState(initialSrc)

  useEffect(() => {
    if (!imgRect || !media?.width || !media?.height) {
      return
    }

    const requiredSize = getRequiredSize(imgRect, media, zoomFactor)
    const preview = getMediaPreviews(media, downloadableIndices).find(p => p.size >= requiredSize)
    if (!preview || preview.url == src) {
      return
    }

    function handleLoad() {
      if (preview) {
        setSrc(preview.url)
      }
    }

    const img = new Image()
    img.addEventListener('load', handleLoad)
    img.src = preview.url

    return () => {
      img.removeEventListener('load', handleLoad)
    }
  }, [imgRect, media, zoomFactor]);

  return src
}

function usePrevNextLoading(prev, next, imgRect) {
  useEffect(() => {
    if (!imgRect) {
      return
    }

    function loadPreview(media) {
      if (!media) {
        return
      }

      const requiredSize = getRequiredSize(imgRect, media)
      const preview = getMediaPreviews(media).find(p => p.size >= requiredSize)
      if (preview) {
        const img = new Image()
        img.src = preview.url
      }
    }

    loadPreview(prev)
    loadPreview(next)
  }, [prev, next, imgRect])
}
