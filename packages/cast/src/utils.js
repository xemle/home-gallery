const getHighestPreview = (previews, maxSize) => {
  return previews
    .map(preview => {
      const match = preview.match(/preview-(\d+)/)
      return [+match[1], preview]
    })
    .filter(([size]) => size <= maxSize)
    .sort(([aSize], [bSize]) => aSize - bSize)
    .map(([_, preview]) => preview)
    .pop()
}

export const getPreview = (entry, type, maxSize = 10000000) => {
  const previews = entry.previews.filter(preview => preview.match(`${type}-preview-\\d+`))
  return getHighestPreview(previews, maxSize)
}
