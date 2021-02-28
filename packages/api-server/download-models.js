const { modelConfig, modelDir } = require('./src/model-config');
const { downloadModels } = require('./src/tensorflow')

const download = async () => {
  await downloadModels(modelConfig, modelDir);
}

download().then(() => console.log(`Download completed`), e => console.log(`Error: ${e}`));
