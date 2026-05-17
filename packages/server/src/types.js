/**
 * @typedef {object} ProcessManager
 * @property {(process: import('child_process').ChildProcess, timeout: number) => void} addProcess
 */
/**
 * @callback TExecuteQueryFn
 * @param {object[]} entries
 * @param {string} query
 * @param {import('@home-gallery/types').TQueryContext} queryContext
 */
/**
 * @typedef {TServerContextExtension & import('@home-gallery/types').TGalleryContext} TServerContext
 */

/**
 * @typedef {object} TServerContextExtension
 * @property {any} config
 * @property {import('./auth/types.js').TAuthContext} auth
 * @property {import('express').Router} router
 * @property {import('./eventbus.js').EventBus} eventBus
 * @property {ProcessManager} processManager
 * @property {import('@home-gallery/types').TServerPluginManager} pluginManager
 * @property {TExecuteQueryFn} executeQuery
 */

export default {}