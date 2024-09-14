export const buildOptions = {
  'full-version': {
    boolean: true,
    describe: 'Show full build version'
  },
}

export const createBuildMiddleware = buildInfo => async (argv) => {
  if (argv.fullVersion && buildInfo?.version) {
    console.log(`Build version: ${buildInfo.version} (commit ${buildInfo.commit}) created by ${buildInfo.createdBy} at ${buildInfo.created}`)
    process.exit(0)
  }
}
