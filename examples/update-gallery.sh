#!/bin/bash

SCRIPT=$0
DIR=$(dirname "$SCRIPT")
DEBUG_PATTERN=*
CONFIG=${CONFIG:-$DIR/config}

echo "Load config from $CONFIG"
source "$CONFIG"

# Save current date to process only new/changed files
CHECKSUM_FROM=$(date -uIseconds)
echo "Index filesystem from $SOURCE_DIR and generate SHA1 checksums of files"
DEBUG=$DEBUG_PATTERN npx gallery index -i "$CONFIG_DIR/index.idx" -d "$SOURCE_DIR" --exclude-from-file $DIR/excludes --exclude-if-present .galleryignore -c

echo "Generate preview images/videos and extract meta data like EXIF or GEO names. This might take a while"
DEBUG=$DEBUG_PATTERN npx gallery extract -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR" -C "$CHECKSUM_FROM"
# Multiple indices are supported by extract
#DEBUG=$DEBUG_PATTERN npx gallery extract -i "$CONFIG_DIR/index.idx" "$CONFIG_DIR/other-index.idx" -s "$STORAGE_DIR" -C "$CHECKSUM_FROM"

echo "Build database for web app"
DEBUG=$DEBUG_PATTERN npx gallery build -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db"
# Multiple indices are supported by build
#DEBUG=$DEBUG_PATTERN npx gallery build -i "$CONFIG_DIR/index.idx" "$CONFIG_DIR/other-index.idx" -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db"
