import { Plugin } from 'vite'

type InjectAppStateOptions = {
  state?: object
  disabled?: string[]
}

/**
 * Inject gallery state in dev mode
 */
export default (options: InjectAppStateOptions = {}): Plugin => ({
  name: 'gallery:inject-app-state',
  enforce: "post",
  apply: "serve",
  transformIndexHtml: {
    /**
     * @param {string} html 
     * @returns {Promise<string>}
     */
    async handler(html) {
      if (!options.disabled?.length || !options.state) {
        return html
      }
      
      return html.replace('<script>window.__homeGallery={}</script>', `<script>window.__homeGallery=${JSON.stringify(options.state || {})}</script>`)
    }
  }
})