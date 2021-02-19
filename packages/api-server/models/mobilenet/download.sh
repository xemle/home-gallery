#!/bin/bash
#
# From https://github.com/tensorflow/tfjs-models/blob/master/mobilenet/src/index.ts
# and https://github.com/tensorflow/tfjs/blob/master/tfjs-converter/src/executor/graph_model.ts
#

BASE_URL=https://tfhub.dev/google/imagenet/mobilenet_v1_100_224/classification/1
PARAM="?tfjs-format=file"
SHARDS=5

FILE=model.json
curl -L "${BASE_URL}/${FILE}${PARAM}" -o "${FILE}";
for n in `seq 1 $SHARDS`; do
  FILE=group1-shard${n}of$SHARDS
  curl -L "${BASE_URL}/${FILE}${PARAM}" -o "${FILE}";
done
