# Extractor with raw files

Tags: extractor, raw

* Start mock server

## No raw preview extraction with a JPG sidecar

* Add file "index/images/DJI_0035.DNG"
* Add file "index/images/DJI_0035.JPG"
* Create index
* Extract files
* Storage has no entry "image-preview-128.jpg" for "08557f10"
* Storage has entry "image-preview-128.jpg" for "e928ea5b"

## Extract raw preview without a JPG sidecar

* Add file "index/images/DJI_0035.DNG"
* Create index
* Extract files
* Storage has entry "raw-preview.jpg" for "08557f10"
* Storage has entry "image-preview-128.jpg" for "08557f10"

___
* Stop server