#!/bin/bash

# Create build information file .build.json
#
# Usage: scripts/build-info.sh <CREATOR>
#
# version is master-abc123 for non tags
# version is 1.2.3 for tags refs


BUILD_REF=$(git describe --all)
BUILD_SHA=$(git rev-parse $BUILD_REF)
BUILD_CREATOR=none

if [ -n $1 ]; then
  BUILD_CREATOR=$1
fi

if [[ BUILD_REF == tags/v* ]]; then
  BUILD_VERSION=${BUILD_REF#tags/v}
else
  BUILD_VERSION=${BUILD_REF#heads/}-${BUILD_SHA::8}
fi

echo -n "{\"version\":\"${BUILD_VERSION}\",\"commit\":\"${BUILD_SHA}\",\"created\":\"$(date -Is)\",\"createdBy\":\"${BUILD_CREATOR}\"}" > .build.json