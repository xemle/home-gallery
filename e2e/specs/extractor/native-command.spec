# Extractor with native commands

Tags: extractor, native

## Create image previews by imagemagick

* Add file "index/images/DJI_0035.JPG"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Start mock server
* Extract files with args "--use-native convert"
* Storage has entry "image-preview-128.jpg" for "e928ea5b"
* Storage has entry "image-preview-128.jpg" for "2e17e23"
* Storage has entry "image-preview-320.jpg" for "2e17e23"
* Storage has entry "image-preview-800.jpg" for "2e17e23"
* Storage has entry "image-preview-1280.jpg" for "2e17e23"
* Storage has entry "image-preview-1920.jpg" for "2e17e23"

## Create image previews by vipsthumbnail

* Add file "index/images/DJI_0035.JPG"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Start mock server
* Extract files with args "--use-native vipsthumbnail"
* Storage has entry "image-preview-128.jpg" for "e928ea5b"
* Storage has entry "image-preview-128.jpg" for "2e17e23"
* Storage has entry "image-preview-320.jpg" for "2e17e23"
* Storage has entry "image-preview-800.jpg" for "2e17e23"
* Storage has entry "image-preview-1280.jpg" for "2e17e23"
* Storage has entry "image-preview-1920.jpg" for "2e17e23"

___
* Stop server
