/**
 * @typedev {object} ProcessManager
 * @property {(process, timeout) => void} addProcess
 */
/**
 * @callback TExecuteQueryFn
 * @param {object[]} entries
 * @param {string} query
 * @param {import('@home-gallery/types').TQueryContext} queryContext
 */

/**
 * @typedef {object} TServerContext
 * @property {any} config
 * @property {EventBus} eventbus
 * @property {ProcessManager} processManager
 * @property {import('@home-gallery/types').TServerPluginManager} pluginManager
 * @property {TExecuteQueryFn} executeQuery
 */

export default {}