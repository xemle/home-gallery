import logger from './src/utils/logger.js'
import { run } from './src/index.js'

run().then(() => logger.info(`Server is up and running`), e => logger.info(`Error: ${e}`, e));
