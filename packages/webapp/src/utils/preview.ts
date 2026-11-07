export const getPreviewSize = preview => {
  const prefix = 'image-preview-'
  const pos = preview.indexOf(prefix) + prefix.length
  const end = preview.indexOf('.', pos)
  if (end - pos < 1) {
    return 0
  }
  return +preview.substring(pos, end)
}

export const byPreviewSize = (a, b) => getPreviewSize(b) - getPreviewSize(a)

const fallbackPreviewURL = createFallbackPreviewURL()

export const getLowerPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => { const s = getPreviewSize(preview); return s > 0 && s <= size}).shift()
  if (!preview) {
    return fallbackPreviewURL
  }
  return `files/${preview}`
}

export const getHigherPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => getPreviewSize(preview) >= size).pop()
  if (!preview) {
    return getLowerPreviewUrl(previews, size)
  }
  return `files/${preview}`
}

export const getWidthFactor = (width, height) => width >= height ? 1 : height / (width || 1)

function createFallbackPreviewURL() {
  const bgColor = '#70707a'
  const fgColor = '#414148'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<path d="M0 0h32v32H0z" style="fill:${fgColor};fill-rule:evenodd;stroke-linecap:round;stroke:none;fill-opacity:1"/>
<path d="M0 0v32h32V0Zm1.002 1.002h29.996v29.996H1.002Z" style="fill:${bgColor};fill-opacity:1;stroke:none;stroke-width:.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/>
<path d="M29.997 16.236 25 10.741 7.502 29.997h22.495ZM8 13.999l-6 6.614v9.384h4.13l8.217-9.018z" style="fill:${bgColor};fill-opacity:1;stroke:none;stroke-width:.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/>
<circle cx="13.78" cy="10" r="3.779" style="fill:${bgColor};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:.264583;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1"/>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}