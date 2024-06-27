import { through } from '@home-gallery/stream'
import { sidecars } from '@home-gallery/common'
const { groupSidecarFiles, ungroupSidecarFiles } = sidecars

export const groupSidecars = () => through(function (entries, _, cb) {
  this.push(groupSidecarFiles(entries))

  cb()
})

export const ungroupSidecars = () => through(function (entry, _, cb) {
  const entries = ungroupSidecarFiles(entry)
  for (let e of entries) {
    this.push(e)
  }

  cb()
})
