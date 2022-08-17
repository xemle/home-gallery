export class Cluster {
  entries = []
  west: number
  east: number
  south: number
  north: number
  distance: number

  constructor(entry, distance) {
    this.distance = distance
    this.entries.push(entry)
    this.west = entry.longitude - distance
    this.east = entry.longitude + distance
    this.south = entry.latitude - distance
    this.north = entry.latitude + distance
  }

  addEntry(entry) {
    this.entries.push(entry)
  }

  get center() {
    const sum = this.entries
      .reduce(([lat, lng], e) => ([lat + e.latitude, lng + e.longitude]), [0, 0])
    return [sum[0] / this.entries.length, sum[1] / this.entries.length]
  }

  contains(entry) {
    return this.west <= entry.longitude && entry.longitude < this.east &&
      this.south <= entry.latitude && entry.latitude < this.north
  }

  get length() {
    return this.entries.length
  }
}

export const clusterEntries = (entries, distance) => {
  let clusters = []
  const t0 = Date.now()
  for (let entry of entries) {
    const cluster = clusters.find(cluster => cluster.contains(entry))
    if (cluster) {
      cluster.addEntry(entry)
    } else {
      clusters.push(new Cluster(entry, distance))
    }
  }

  //console.log(`Found ${clusters.length} clusters from ${entries.length} entries in ${Date.now() - t0}ms`)
  return clusters
}
