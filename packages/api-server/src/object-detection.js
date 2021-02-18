const cocoSdd = require('@tensorflow-models/coco-ssd');

const objectDetection = async (decodeJpeg) => {
  const modelName = 'coco-ssd'
  console.log(`Loading model ${modelName}...`);

  const t0 = Date.now();
  const config = {
    base: 'mobilenet_v2'
  }
  const model = await cocoSdd.load(config);
  const version = `${config.base}`;
  console.log(`Loaded model ${modelName} ${version} in ${Date.now() - t0}ms`);

  return {
    model: modelName,
    version,
    fromJpg: async (data) => {
      const input = decodeJpeg(data);
      const objects = await model.detect(input);
      input.dispose();
      return objects;
    }
  }
}

module.exports = objectDetection;
