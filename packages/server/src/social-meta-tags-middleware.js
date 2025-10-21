export async function socialMetaTagsMiddleware(context) {
  const { config, router, database: { filterDatabase } } = context

  async function addSocialMetaTags(req, res, next) {
    const { id } = req.params
    const entries = []
    if (id?.match(/^\w{4,40}$/)) {
      const database = await filterDatabase(`id:${id}`, req)
      if (database.data.length) {
        const entry = database.data[0]
        entries.push(entry)
        injectSocialMetaTags(req, res, config, entry)
      }
    }

    // overwrite entries to requested single entry
    req.webapp = {
      ...req.webapp,
      state: {
        ...req.webapp?.state,
        entries,
      },
    }

    next()
  }

  router.use('/view/:id', addSocialMetaTags)
  router.use('/share/:id', addSocialMetaTags)
  router.use('/share/:id', disableFeatures)
}

function injectSocialMetaTags(req, res, config, entry) {
  const basePath = config?.server?.basePath || '/'
  const publicUrlByRequest = `${req.protocol}://${req.get('host')}${basePath}`
  const publicUrl = (config?.server?.publicUrl || publicUrlByRequest).replace(/([^/])\/$/, '$1')

  const title = (entry.files?.[0]?.filename || 'Photo').replace(/.*[/\\]/, '')

  const descriptionParts = [
    entry.model,
    entry.iso ? `ISO/${entry.iso}` : '',
    entry.shutterSpeed ? `${entry.shutterSpeed}s` : '',
    entry.aperture ? `f/${entry.aperture}` : '',
    entry.focalLength ? `${entry.focalLength}mm` : ''
  ]
  const description = descriptionParts.filter(Boolean).join(' | ')

  const preview = entry.previews
    .filter(p => p.includes('-image-preview'))
    .sort((a, b) => {
      const aSize = a.match(/-preview-(\d+)\./)?.[0] || 1920
      const bSize = b.match(/-preview-(\d+)\./)?.[0] || 1920
      return bSize - aSize
    })
    .pop()
  const previewUrl = `${publicUrl}/files/${preview}`

  const metaTags = [
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${previewUrl}"/>`,
    `<meta property="og:image:width" content="${entry.height}">`,
    `<meta property="og:image:height" content="${entry.width}"/>`,
    `<meta property="og:url" content="${publicUrl}/share/${entry.id.substring(0, 7)}"/>`,
  ].map(m => '  ' + m).join('\n') + '\n'

  // overwrite res.send to inject meta tags to response body
  const originalSend = res.send
  res.send = function (body) {
    if (body.includes('</head>')) {
      body = body.replace('</head>', metaTags + '</head>')
    }

    res.send = originalSend // restore orignal function
    return res.send.call(this, body)
  }
}

function disableFeatures(req, res, next) {
  const state = req.webapp?.state
  const pages = state?.pages
  const mediaView = pages?.mediaView

  req.webapp = {
    ...req.webapp,
    state: {
      ...state,
      disabled: [...state?.disabled || [], 'database', 'serverEvents', 'events', 'edit', 'pwa'],
      pages: {
        ...pages,
        disabled: [...pages?.disabled || [], 'date', 'map', 'edit', 'video', 'tag'],
        mediaView: {
          ...mediaView,
          disabled: [...mediaView?.disabled || [], 'nav', 'edit', 'map', 'similar', 'annotation'],
        }
      }
    }
  }

  next()
}
