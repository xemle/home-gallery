export const createFilterChain = (filters) => {
  if (!filters.length) {
    return () => true
  }

  return (filename, stat) => {
    for (let i = 0; i < filters.length; i++) {
      if (!filters[i](filename, stat)) {
        return false
      }
    }
    return true
  }
}
