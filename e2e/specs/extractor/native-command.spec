# Extractor with native commands

Tags: extractor, native

* Start mock server

## Create image previews by imagemagick

* Add file "index/images/DJI_0035.JPG"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Extract files with args "--use-native convert"
* Storage has entry "image-preview-128.jpg" for "e928ea5b"
* Storage has entry "image-preview-128.jpg" for "2e17e23"
* Storage has entry "image-preview-320.jpg" for "2e17e23"
* Storage has entry "image-preview-800.jpg" for "2e17e23"
* Storage has entry "image-preview-1280.jpg" for "2e17e23"
* Storage has entry "image-preview-1920.jpg" for "2e17e23"
* Storage image "image-preview-1920.jpg" for "e928ea5b" has size "1920x1439"
* Storage image "image-preview-1920.jpg" for "2e17e23" has size "1080x1920"

## Create image previews by vipsthumbnail

* Add file "index/images/DJI_0035.JPG"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Extract files with args "--use-native vipsthumbnail"
* Storage has entry "image-preview-128.jpg" for "e928ea5b"
* Storage has entry "image-preview-128.jpg" for "2e17e23"
* Storage has entry "image-preview-320.jpg" for "2e17e23"
* Storage has entry "image-preview-800.jpg" for "2e17e23"
* Storage has entry "image-preview-1280.jpg" for "2e17e23"
* Storage has entry "image-preview-1920.jpg" for "2e17e23"
* Storage image "image-preview-1920.jpg" for "e928ea5b" has size "1920x1439"
* Storage image "image-preview-1920.jpg" for "2e17e23" has size "1080x1920"

___
* Stop server
