/**
 * Inject gallery state in dev mode
 * 
 * @param {{state?: object, disabled?: boolean}} [options]
 */
export default (options = {}) => ({
  name: 'gallery:inject-app-state',
  enforce: "post",
  apply: "serve",
  transformIndexHtml: {
    /**
     * @param {string} html 
     * @returns {string}
     */
    async handler(html) {
      if (options.disabled || !options.state) {
        return html
      }
      
      return html.replace('<script>window.__homeGallery={}</script>', `<script>window.__homeGallery=${JSON.stringify(options.state || {})}</script>`)
    }
  }
})