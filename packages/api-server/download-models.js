import { getModelConfig, modelDir } from './src/model-config.js'
import { downloadModels } from './src/tensorflow/index.js'

const download = async () => {
  const modelConfig = await getModelConfig()
  await downloadModels(modelConfig, modelDir);
}

console.log(`Downloading required models`);
download().then(() => console.log(`Download completed`), e => console.log(`Error: ${e}`));
