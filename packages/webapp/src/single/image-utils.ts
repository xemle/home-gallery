export const getPreviewSize = preview => {
  const match = preview.match(/image-preview-(\d+)\./)
  return match ? +match[1] : 0
}

export const byPreviewSize = (a, b) => getPreviewSize(b) - getPreviewSize(a)

export const getPreviewUrl = (previews, size) => '/files/' + previews.filter(p => getPreviewSize(p) <= size).sort(byPreviewSize)[0]
