# Extractor: Video

Tags: extractor, video

* Start mock server
* Init config
* Set test env

## Custom video size

Test custom video preview settings such as preview size, frame rate, portrait video

* Set config "extractor.video.previewSize" to "640"
* Set config "extractor.video.frameRate" to "25"
* Add file "extractor/video/IMG_20220908_180939.mp4"
* Create index
* Extract files
* Storage has entry "video-preview-640.mp4" for "5925b60"
* Storage entry "video-preview-640.mp4" for "5925b60" has exif value "640" for "ImageWidth"
* Storage entry "video-preview-640.mp4" for "5925b60" has exif value "1138" for "ImageHeight"
* Storage entry "video-preview-640.mp4" for "5925b60" has exif value "25" for "VideoFrameRate"

## Video scale with min max

* Set config "extractor.video.previewSize" to "640"
* Set config "extractor.video.scale" to "-2:'min(ih,max(320,min(640,ih*.5)))'"
* Add file "extractor/video/IMG_3048.mp4"
* Create index
* Extract files
* Storage has entry "video-preview-640.mp4" for "99379d9"
* Storage entry "video-preview-640.mp4" for "99379d9" has exif value "960" for "ImageWidth"
* Storage entry "video-preview-640.mp4" for "99379d9" has exif value "540" for "ImageHeight"

___
* Stop server