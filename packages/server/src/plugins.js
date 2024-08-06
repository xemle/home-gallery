import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const getPluginFiles = () => {
  return [
    path.resolve(__dirname, 'api/database/queryTextCache.js'),
    path.resolve(__dirname, 'auth/userFilter.js'),
  ]
}