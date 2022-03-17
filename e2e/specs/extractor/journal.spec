# Extractor option: journal

Tags: extractor, option, journal

* Start mock server

## Initial index

* Init files from "index/basic"
* Create index with args "--journal abc"
* Extract files with args "--journal abc"
* Storage has entry "image-preview-128.jpg" for "25d7b73"
* Storage has entry "image-preview-128.jpg" for "96419bb"

## Extract only new added files

* Init index from "index/basic"
* Add file "index/images/DJI_0035.JPG"
* Update index with args "--journal abc"
* Extract files with args "--journal abc"
* Storage has no entry for "25d7b73"
* Storage has no entry for "96419bb"
* Storage has entry "image-preview-128.jpg" for "e928ea"

## Extract only new renamed files

* Init index from "index/basic"
* Create index
* Rename file "IMG_2915.JPG" to "renamed.JPG"
* Update index with args "--journal abc"
* Extract files with args "--journal abc"
* Storage has no entry for "25d7b73"
* Storage has entry "image-preview-128.jpg" for "96419bb"

## No entries for removed files

* Init index from "index/basic"
* Create index
* Remove file "IMG_2915.JPG"
* Update index with args "--journal abc"
* Extract files with args "--journal abc"
* Storage has no entry for "25d7b73"
* Storage has no entry for "96419bb"

___
* Stop server