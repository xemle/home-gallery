import path from 'path'
import fs from 'fs/promises'

import Logger from '@home-gallery/logger'

const log = Logger('browserPlugin')

/**
 * @typedef {object} TBrowserPlugin
 * @property {(req, req, next) => void} static
 * @property {string[]} config
 */
/**
 * @param {import('./types.js').TServerContext} context
 * @param {string} prefix
 * @returns
 */
export const browserPlugin = (context, prefix) => {
  const { pluginManager } = context
  const plugins = pluginManager.getBrowserPlugins().plugins

  const pluginEntries = plugins.map(p => prefix + p.publicEntry)

  return {
    static: async (req, res) => {
      if (req.method != 'GET') {
        res.append('Allow', 'GET')
        res.status(405).json({ error: 'Method not allowed'})
        return
      }
      const reqPath = req.path.substring(1) // remove leading slash
      const plugin = plugins.find(p => reqPath.startsWith(p.publicPath))
      if (!plugin) {
        log.debug(`Unknown plugin path: ${reqPath}`)
        res.status(404).json({ error: 'Not found'})
        return
      }
      const relativePath = reqPath.substring(plugin.publicPath.length)
      const localResourcePath = path.resolve(plugin.localDir, relativePath)

      const isFile = await fs.stat(localResourcePath).then(stat => stat.isFile()).catch(() => false)
      if (!isFile) {
        log.warn(`Unknown plugin resource for plugin ${plugin.plugin.name}: ${reqPath}`)
        res.status(404).json({ error: 'Not found'})
        return
      }
      res.sendFile(localResourcePath)
    },
    pluginEntries
  }
}