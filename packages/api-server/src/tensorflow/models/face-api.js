const faceapi = require('@vladmandic/face-api');

const toPoint = p => { return {x: p.x, y: p.y } }

const toBox = b => { return {x: b.x, y: b.y, width: b.width, height: b.height} }

const mapLandmarksToObjec = landmarks => {
  return {
    positions: landmarks.positions.map(toPoint),
    leftEye: landmarks.getLeftEye().map(toPoint),
    leftEyeBrow: landmarks.getLeftEyeBrow().map(toPoint),
    rightEye: landmarks.getRightEye().map(toPoint),
    rightEyeBrow: landmarks.getRightEyeBrow().map(toPoint),
    mouth: landmarks.getMouth().map(toPoint),
    nose: landmarks.getNose().map(toPoint),
    jawOutline: landmarks.getJawOutline().map(toPoint),
    refPointsForAlignment: landmarks.getRefPointsForAlignment().map(toPoint)
  }
}

const mapFaceToObject = face => {
  const { gender, genderProbability, age, expressions, landmarks, descriptor, alignedRect } = face;

  return {
    alignedRect: {
      box: toBox(alignedRect.box),
      score: alignedRect.score
    },
    gender,
    genderProbability,
    age,
    expressions: {
      neutral: expressions.neutral,
      happy: expressions.happy,
      sad: expressions.sad,
      angry: expressions.angry,
      fearful: expressions.fearful,
      disgusted: expressions.disgusted,
      surprised: expressions.surprised,
    },
    landmarks: mapLandmarksToObjec(landmarks),
    descriptor: descriptor
  }
}

const initFaceApi = async ({ modelPath, minScore, maxResults } = {}) => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
  const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });

  const detect = async (input, originalResult) => {
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
    return originalResult ? result : result.map(mapFaceToObject);
  }

  return { faceapi, detect }
}

module.exports = initFaceApi;
