# Extractor

Tags: extractor

* Start mock server

## Create previews

* Init index from "index/basic"
* Extract files
* Storage has entry "image-preview-128.jpg" for "25d7b73"
* Storage has entry "image-preview-128.jpg" for "96419bb"
* Storage has entry "image-preview-320.jpg" for "96419bb"
* Storage has entry "image-preview-800.jpg" for "96419bb"
* Storage has entry "image-preview-1280.jpg" for "96419bb"
* Storage has entry "image-preview-1920.jpg" for "96419bb"

## Create portait previews

* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Extract files
* Storage has entry "image-preview-128.jpg" for "2e17e23"
* Storage has entry "image-preview-1920.jpg" for "2e17e23"
* Storage image "image-preview-128.jpg" for "2e17e23" has size "72x128"
* Storage image "image-preview-1920.jpg" for "2e17e23" has size "1080x1920"

## API Server Calls On Smaller Preview Images

* Add file "index/images/DJI_0035.640.JPG"
* Create index
* Extract files
* Storage has entry "image-preview-128.jpg" for "e3e4ce1"
* Storage has entry "image-preview-320.jpg" for "e3e4ce1"
* Storage has no entry "image-preview-800.jpg" for "e3e4ce1"
* Storage has entry "objects.json" for "e3e4ce1"

___
* Stop server