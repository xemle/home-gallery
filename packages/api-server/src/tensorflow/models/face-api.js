const faceapi = require('@vladmandic/face-api/dist/face-api.node-cpu');

const initFaceApi = async (modelPath, { minScore, maxResults } = {}) => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
  const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });

  const detect = async (input) => {
    const casted = input.toFloat();
    const tensor = casted.expandDims(0);
    casted.dispose();

    const result = await faceapi
      .detectAllFaces(tensor, optionsSSDMobileNet)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors()
      .withAgeAndGender();
    tensor.dispose();
    return result;
  }

  return { faceapi, detect }
}

module.exports = initFaceApi;
