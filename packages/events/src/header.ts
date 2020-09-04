export const HeaderType = "home-gallery/events@1.0"

export const createHeader = () => {
  return {
    type: HeaderType,
    created: new Date().toISOString()
  }
}