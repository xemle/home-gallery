/**
 * @param {import('../types.js').TServerContext} context
 */
export async function versionApi(context) {
  const { router, buildInfo } = context
  const { version, commit, created } = buildInfo || {}

  const data = {
    version: version || 'unknown',
    commit,
    created
  }

  router.get('/api/version', (_, res) => res.json(data))
}
