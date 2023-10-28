# Extractor with heic files

Tags: extractor, heif, heic

* Start mock server

## No heic preview extraction with a JPG sidecar

* Add file "index/images/sample1.heic"
* Add file "index/images/sample1.jpg"
* Create index
* Extract files
* Storage has no entry "image-preview-128.jpg" for "ff0ed37"
* Storage has entry "image-preview-128.jpg" for "a39139c"

## Extract heic preview without a JPG sidecar

* Add file "index/images/sample1.heic"
* Create index
* Extract files
* Storage has entry "raw-preview.jpg" for "ff0ed37"
* Storage has entry "raw-preview-exif.json" for "ff0ed37"
* Storage has entry "image-preview-128.jpg" for "ff0ed37"

## Custom image size with heic files

* Add file "index/images/DJI_0035.heic"
* Set test env
* Init config
* Set config "extractor.image.previewSizes" to "[2048,1024]"
* Create index
* Extract files
* Storage has entry "raw-preview.jpg" for "636f79d"
* Storage has entry "raw-preview-exif.json" for "636f79d"
* Storage has entry "image-preview-2048.jpg" for "636f79d"
* Storage has entry "image-preview-1024.jpg" for "636f79d"

___
* Stop server