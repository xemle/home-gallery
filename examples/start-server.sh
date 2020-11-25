#!/bin/bash

SCRIPT=$0
DIR=$(dirname "$SCRIPT")
GALLERY_HOME=${GALLERY_HOME:-$DIR/..}
DEBUG_PATTERN=server*
CONFIG=${CONFIG:-$DIR/config}

echo "Load config from $CONFIG"
source "$CONFIG"

echo "Start HomeGallery web server"
DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/index.js server -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db" -e "$CONFIG_DIR/events.db" --host 0.0.0.0
# option '--host 0.0.0.0' listens on all interfaces and opens the gallery to other devices such as mobile phones
