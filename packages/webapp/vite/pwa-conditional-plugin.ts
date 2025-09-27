import { Plugin } from 'vite'

const script = `<script>
  (function(config) {
    const hasSW = 'serviceWorker' in navigator
    const isLocal = location.hostname == 'localhost' || location.hostname == '127.0.0.1'
    const isDisabled = (config.disabled || []).includes('pwa')

    const register = hasSW && !isLocal && !isDisabled
    const unregister = hasSW && (isLocal || isDisabled)

    if (register) {
      console.log('Enable PWA ServiceWorker')
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
      })
    }

    if (unregister) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length) {
          console.log('Unregister PWA ServiceWorker')
        }
        for(const registration of registrations) {
          registration.unregister()
        }
      }).catch(err => {
        console.error('Unregistration of PWA ServiceWorker failed: ', err)
      })
    }
  })(window.__homeGallery || {})
</script>`

type pwaConditionalPluginOptions = {
  disabled?: boolean
}

/**
 * Customize the PWA integration of vite-plugin-pwa to make it conditional and integrate it with gallery config
 * 
 * @param {{disabled?: boolean}} options
 */
export default (options: pwaConditionalPluginOptions = {}): Plugin => ({
  name: 'gallery:pwa-conditional',
  enforce: "post",
  apply: "build",
  transformIndexHtml: {
    order: 'post',
    async handler(html) {
      const headStart = html.indexOf('<head>') + 6
      const headEnd = html.indexOf('</head>')
      if (headStart < 6 || headEnd < 0 || options.disabled) {
        return html
      }
      
      const lines = html.substring(headStart, headEnd).split('\n')
      const headLines = lines.filter(line => !line.includes('manifest'))
      headLines.push('  <link rel="manifest" href="./manifest.webmanifest" crossorigin="use-credentials">')


      return html.substring(0, headStart) + headLines.join('\n') + '\n' + html.substring(headEnd).replace('</body>', `${script}\n</body>`)
    }
  }
})