#!/bin/bash

./init.sh
if [ $? -ne 0 ]; then
  echo "Initialization failed. Run init.sh manually to fix it"
  exit 1
fi

./update-gallery.sh --full
if [ $? -ne 0 ]; then
  echo "Update gallery failed. Run update-gallery.sh manually to fix it"
  exit 1
fi

./start-server.sh
if [ $? -ne 0 ]; then
  echo "Start server failed. Run start-server.sh manually to fix it"
  exit 1
fi

echo "HomeGallery was installed successfully"
