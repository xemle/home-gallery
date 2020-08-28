# Home Gallery - API Server

This is the implementation of api.home-gallery.org to offer embeddings from mobilenet for similarity vector.

Try

```
curl -s -H Content-Type:image/jpeg --data-binary @sample.jpg https://api.home-gallery.org/embeddings
```

## Motivation

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

If your hardware supports AVX CPU instruction you can use this api server from local.

## Using node

```
npm i
npm run serve
```

Get embeddings
```
curl -s -H Content-Type:image/jpeg --data-binary @sample.jpg http://localhost:3000/embeddings | jq . | less
```

should output something like:

```
{
  "srcSha1sum": "17f5e000be30d7915fe161a03db2773de279df1f",
  "model": "mobilenet",
  "version": "v2_1.0",
  "created": "2020-08-28T22:45:38.700Z",
  "data": [
    0,
    0.77776038646698,
    1.3469879627227783,
    1.1031835079193115,
    0,
...
    0,
    0.7608206868171692,
    0.10224873572587967
  ]
}
```

## Using Docker

```
docker build -t api-server .
docker run -p 3000:3000 api-server
```