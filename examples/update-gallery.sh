#!/bin/bash

SCRIPT=$0
DIR=$(dirname "$SCRIPT")
GALLERY_HOME=${GALLERY_HOME:-$DIR/..}
DEBUG_PATTERN=*
CONFIG=${CONFIG:-$DIR/config}
FULL_UPDATE=

echo "Load config from $CONFIG"
source "$CONFIG"

while [ -n "$1" ]; do
  case "$1" in
    --full) FULL_UPDATE=1;;
  esac
  shift
done

# Save current date to process only new/changed files for partial upd
CHECKSUM_FROM=$(date +%Y-%m-%d)
echo "Index filesystem from $SOURCE_DIR and generate SHA1 checksums of files"
DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js index -i "$CONFIG_DIR/index.idx" -d "$SOURCE_DIR" --exclude-from-file $DIR/excludes --exclude-if-present .galleryignore -c

if [ "$FULL_UPDATE" -eq 1 ]; then
  echo "Generate preview images/videos and extract meta data like EXIF or GEO names. Process all files, this might take a while"
  DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js extract -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR"
else
  echo "Generate preview images/videos and extract meta data like EXIF or GEO names. Partial update since $CHECKSUM_FROM"
  DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js extract -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR" -C "$CHECKSUM_FROM"
  # Multiple indices are supported by extract
  #DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js extract -i "$CONFIG_DIR/index.idx" "$CONFIG_DIR/other-index.idx" -s "$STORAGE_DIR" -C "$CHECKSUM_FROM"
fi

echo "Build database for web app"
DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js build -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db"
# Multiple indices are supported by build
#DEBUG=$DEBUG_PATTERN node $GALLERY_HOME/cli.js build -i "$CONFIG_DIR/index.idx" "$CONFIG_DIR/other-index.idx" -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db"
