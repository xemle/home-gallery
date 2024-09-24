/* globals gauge*/
"use strict"
const { addCliEnv, getBaseDir, getPath, getConfigFilename } = require('../utils')

step("Set test env", async () => {
  addCliEnv({
    GALLERY_CONFIG: getConfigFilename(),
    GALLERY_CONFIG_DIR: getPath('config'),
    GALLERY_CACHE_DIR: getBaseDir()
  })
})

step("Set test cache env", async () => {
  addCliEnv({
    GALLERY_CACHE_DIR: getBaseDir()
  })
})


