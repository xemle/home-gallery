# Home Gallery - API Server

This is the implementation of api.home-gallery.org to offers objects and face, similarity detections through [tensorflowjs](https://www.tensorflow.org/js). It uses:

* embeddings from [mobilenet v1](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) for similarity vector
* [Coco SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) for object detection
* [FaceAPI.js](https://github.com/vladmandic/face-api) for face detection

Try

```
curl -s -H Content-Type:image/jpeg --data-binary @sample.jpg https://api.home-gallery.org/embeddings
```

## Rest API

### Embeddings

```
curl -s -H Content-Type:image/jpeg --data-binary @sample.jpg http://localhost:3000/embeddings | jq . | less
```

outputs something like:

```
{
  "srcSha1sum": "17f5e000be30d7915fe161a03db2773de279df1f",
  "model": "mobilenet",
  "version": "v1_1.0",
  "created": "2020-08-31T20:42:40.474Z",
  "data": [
    0,
    1.5944138765335083,
    0,
    1.6949909925460815,
    0,
...
    0.2866695821285248,
    1.263915777206421,
    0.07164981961250305
  ]
}
```

### Object detection

```
curl -s -H Content-Type:image/jpeg --data-binary @sample-2.jpg http://localhost:3000/objects | jq . | less
```

outputs something like:

```
{
  "srcSha1sum": "c3328f60fd4fc6c85bfff3fdba9e2f067c135e5f",
  "model": "cocossd",
  "version": "mobilenet_v2",
  "created": "2021-02-28T07:15:11.522Z",
  "width": 300,
  "height": 188,
  "data": [
    {
      "bbox": [
        84.70062017440796,
        43.14745032787323,
        62.255698442459106,
        116.64235699176788
      ],
      "class": "person",
      "score": 0.9090986251831055
    },
    ...
```

### Face detection

```
curl -s -H Content-Type:image/jpeg --data-binary @sample-2.jpg http://localhost:3000/faces | jq . | less
```

outputs something like:

```
{
  "srcSha1sum": "c3328f60fd4fc6c85bfff3fdba9e2f067c135e5f",
  "model": "face-api",
  "created": "2021-02-28T07:14:12.858Z",
  "width": 300,
  "height": 188,
  "data": [
    {
      "alignedRect": {
        "box": {
          "x": 99.93320540934802,
          "y": 53.161558397351016,
          "width": 24.010922688245774,
          "height": 21.71620030403137
        },
        "score": 0.9825689196586609
      },
      "gender": "male",
      "genderProbability": 0.9902002215385437,
      "age": 40.70022201538086,
      "expressions": {
        "neutral": 0.7269296646118164,
        "happy": 2.890040195779875e-05,
        "sad": 2.4574979761382565e-05,
        "angry": 0.27233782410621643,
        "fearful": 5.979609909445571e-07,
        "disgusted": 0.0006730938912369311,
        "surprised": 5.291645265970146e-06
      },
      ...
```

## Using node

```
npm i
npm run serve
```

## Using Docker

```
docker build -t api-server .
docker run -p 3000:3000 api-server
```

Run api-server with node backend

```
docker run -p 3000:3000 -e BACKEND=node api-server
```

## Tensorflow backends

api-server supports following backends through `BACKEND` environment

* `node` - fastest. See [notes](#libtensorflow) for supported CPUs
* `wasm` - moderate and default setting. Requires node >= 14
* `cpu` - slowest. As last fallback

## libtensorflow

The tensorflow library is build with AVX CPU instruction which is supported by newer CPUs (> 2011).

| Starting with TensorFlow 1.6, binaries use AVX instructions which may not run on older CPUs.
https://www.tensorflow.org/install/pip

Without the AVX CPU instruction loading tensorflow exists with 'Illegal instruction'.

To check your CPU run

```
grep avx /proc/cpuinfo
```

My PC, NAS and Raspberry PI 4 do not suport AVX CPU instruction. Only my dedicated root server
was supporting AVX CPU instruction and one solution was to offer a public API - also for others.

If your hardware does not supports AVX CPU instruction you can use this api server with `wasm` or `cpu` backend.