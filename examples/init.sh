#!/bin/bash

SCRIPT=$0
DIR=$(dirname "$SCRIPT")
GALLERY_SRC=${GALLERY_SRC:-$DIR/..}

if [ ! -x "$(which npm)" -o ! -x "$(which node)" ]; then
  echo "Could not find npm or node binaries. Please install node TLS version from https://nodejs.org"
  exit 1
fi
echo "Change directory to sources $GALLERY_SRC"
cd $GALLERY_SRC

echo "Install package dependencies"
npm install
if [ $? -ne 0 ]; then
  echo "Installation of package dependencies failed. Run 'npm install' manually to fix it"
  exit 1
fi

echo "Install module dependencies"
npm run bootstrap
if [ $? -ne 0 ]; then
  echo "Installation of module dependencies failed. Run 'npm run bootstrap' manually to fix it"
  exit 1
fi

echo "Build sources"
npm run build
if [ $? -ne 0 ]; then
  echo "Build sources failed. Run 'npm run build' manually to fix it"
  exit 1
fi

npm link
if [ $? -ne 0 ]; then
  echo "Linking failed. Run 'npm link' manually to fix it"
  exit 1
fi
echo "HomeGallery CLI is ready to run via 'npx gallery'"

cd - > /dev/null
