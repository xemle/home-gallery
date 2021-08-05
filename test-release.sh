#!/bin/sh

echo "Run E2E tests"
npm i
npm run build
npm run test:e2e

echo "Run E2E on docker"
docker build -t home-gallery .
npm run test:e2e -- --tags docker --env docker,default

echo "Run E2E on binary"
node scripts/bundle.js --filter=linux-x64 --version=0.0.0 --snapshot=-RC
chmod 755 dist/0.0.0/home-gallery-0.0.0-RC-linux-x64
if [ -e gallery.bin ]; then 
  rm -f gallery.bin
fi
ln -s dist/0.0.0/home-gallery-0.0.0-RC-linux-x64 gallery.bin
rm -rf /tmp/caxa/home-gallery/0.0.0
npm run test:e2e -- --env binary,default
