# Extractor: Image

Tags: extractor

* Start mock server
* Init config
* Set test env

## Create custom previews sizes

* Set config "extractor.image.previewSizes" to "[640,256]"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Extract files
* Storage has entry "image-preview-640.jpg" for "2e17e23"
* Storage has entry "image-preview-256.jpg" for "2e17e23"

## webp format

* Add file "extractor/images/IMG_20190807_105328.webp"
* Create index
* Extract files
* Storage has entry "image-preview-1920.jpg" for "3f184e8"

___
* Stop server