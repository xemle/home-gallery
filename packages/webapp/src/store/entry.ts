export interface Entry {
  id: string
  shortId: string
  type: string
  date: string
  year: number
  width: number
  height: number
  tags: string[]
  appliedEventIds?: string[],
  textCache?: string | false
  similarityHash: string
  faces?: any[],
}