const { through } = require('@home-gallery/stream')
const { sidecars } = require('@home-gallery/common')
const { groupSidecarFiles, ungroupSidecarFiles } = sidecars

const groupSidecars = () => through(function (entries, _, cb) {
  this.push(groupSidecarFiles(entries))

  cb()
})

const ungroupSidecars = () => through(function (entry, _, cb) {
  const entries = ungroupSidecarFiles(entry)
  for (let e of entries) {
    this.push(e)
  }

  cb()
})

module.exports = {
  groupSidecars,
  ungroupSidecars
}