#!/bin/bash
#
# From https://github.com/tensorflow/tfjs-models/blob/62f4f9c20db0eef4cae1ee82d000b9cd69696a58/coco-ssd/src/index.ts
#

BASE_URL=https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2
SHARDS=17

FILE=model.json
curl -L "${BASE_URL}/${FILE}" -o "${FILE}";
for n in `seq 1 $SHARDS`; do
  FILE=group1-shard${n}of${SHARDS}
  curl -L "${BASE_URL}/${FILE}" -o "${FILE}";
done
