const mobilenet = require('@tensorflow-models/mobilenet');

const init = async (config) => {
  const model = await mobilenet.load(config);

  const classify = async (input) => await model.classify(input);

  const infer = async (input) => {
    const infer = model.infer(input, true);
    const embeddings = infer.arraySync()[0];
    infer.dispose();
    return embeddings;
  }

  return { model, classify, infer };
}

module.exports = init;
