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

___
* Stop server