// utils/preview.ts

export const getPreviewSize = preview => {
  const prefix = 'image-preview-'
  const pos = preview.indexOf(prefix) + prefix.length
  const end = preview.indexOf('.', pos)
  if (end - pos < 1) return 0
  return +preview.substring(pos, end)
}

export const byPreviewSize = (a, b) => getPreviewSize(b) - getPreviewSize(a)

export const normalizePreviewUrl = (url: string) => {
  const trimmed = url.replace(/^\/+/, '')
  if (/^https?:\/\//.test(trimmed)) return trimmed       // raw remote
  if (/^remote\//.test(trimmed)) return trimmed          // proxied remote, backend handles /files/
  return `files/${trimmed}`                               // local file
}

export const getLowerPreviewUrl = (previews, size) => {
  const preview = previews?.filter(p => { const s = getPreviewSize(p); return s > 0 && s <= size }).shift()
  if (!preview) return false
  return normalizePreviewUrl(preview)
}

export const getHigherPreviewUrl = (previews, size) => {
  const preview = previews?.filter(p => getPreviewSize(p) >= size).pop()
  if (!preview) return getLowerPreviewUrl(previews, size)
  return normalizePreviewUrl(preview)
}

export const getWidthFactor = (width, height) => width >= height ? 1 : height / (width || 1)
