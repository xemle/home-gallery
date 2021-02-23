const cocoSsd = require('@tensorflow-models/coco-ssd');

const init = async (config) => {
  const model = await cocoSsd.load(config)

  const detect = async (input, { maxNumBoxes, minScore } = {}) => {
    maxNumBoxes = maxNumBoxes || 20;
    minScore = minScore || .1
    return model.detect(input, maxNumBoxes, minScore)
  }

  return { model, detect }
}

module.exports = init;
