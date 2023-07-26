import { useMemo } from "react";
import useBodyDimensions from "../utils/useBodyDimensions";

export const usePreviewSize = () => {
  const { height, width } = useBodyDimensions()

  const previewWidth = useMemo(() => Math.max(width, height), [height, width])

  return previewWidth
}
