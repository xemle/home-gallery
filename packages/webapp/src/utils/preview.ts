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

export const getLowerPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => { const s = getPreviewSize(preview); return s > 0 && s <= size}).shift()
  if (!preview) {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" height="${size}px" width="${size}px" version="1.1" id="Capa_1" xmlns:xlink="http://www.w3.org/1999/xlink" 
	    viewBox="0 0 21.041 21.041" xml:space="preserve">
      <g>
        <g id="c88_square">
          <path d="M20.51,0H0.524C0.267,0,0.056,0.209,0.056,0.469v20.104c0,0.255,0.211,0.468,0.468,0.468H20.51
            c0.263,0,0.476-0.213,0.476-0.468V0.469C20.986,0.209,20.772,0,20.51,0z M19.535,19.573H1.001V1.001h18.534V19.573z"/>
        </g>
        <g id="Capa_1_233_">
        </g>
      </g>
    </svg>`;
    // Encode the string safely for the src attribute
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
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
