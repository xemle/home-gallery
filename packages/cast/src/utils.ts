import { TDatabaseEntry } from "./types.js"

const getHighestPreview = (previews: string[], maxSize: number) => {
  return previews
    .map(preview => {
      const match = preview.match(/preview-(\d+)/)
      return [match && +match[1] || 0, preview] as [number, string]
    })
    .filter(([size]) => size <= maxSize)
    .sort(([aSize], [bSize]) => aSize - bSize)
    .map(([_, preview]) => preview)
    .pop()
}

export const getPreview = (entry: TDatabaseEntry, type: string, maxSize = 10000000) => {
  const previews = entry.previews.filter(preview => preview.match(`${type}-preview-\\d+`))
  return getHighestPreview(previews, maxSize)
}
