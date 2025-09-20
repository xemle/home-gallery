import logger from './src/utils/logger.js'
import { getModelConfig, modelDir } from './src/model-config.js'
import { downloadModels } from './src/tensorflow/index.js'

const download = async () => {
  const modelConfig = await getModelConfig()
  await downloadModels(modelConfig, modelDir);
}

logger.info(`Downloading required models`);
download().then(() => logger.info(`Download completed`), e => logger.error(e, `Error: ${e}`));
