export const getPreviewSize = preview => {
  const match = preview.match(/image-preview-(\d+)\./)
  return match ? +match[1] : 0
}

export const byPreviewSize = (a, b) => getPreviewSize(b) - getPreviewSize(a)

export const getLowerPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => { const s = getPreviewSize(preview); return s > 0 && s <= size}).shift()
  if (!preview) {
    return false
  }
  return `files/${preview}`
}

export const getHigherPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => getPreviewSize(preview) >= size).pop() || getLowerPreviewUrl(previews, size)
  if (!preview) {
    return false
  }
  return `files/${preview}`
}

export const getWidthFactor = (width, height) => width >= height ? 1 : height / (width || 1)
