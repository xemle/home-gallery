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

## Using Docker

```
docker build -t api-server .
docker run -p 3000:3000 api-server
```
