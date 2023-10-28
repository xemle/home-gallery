# Storage

Tags: storage

* Start mock server

## Has exif sidecar

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Storage has entry "meta.cache" for "5075772"
* Storage has entry "exif.json" for "b465718"
* Storage has no entry for "71cc14a"

## Has updated exif sidecar

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Add file "extractor/images/exif-tags-update.jpg.xmp" as "exif-tags.jpg.xmp"
* Build database
* Storage has entry "meta.cache" for "5075772"
* Storage has entry "exif.json" for "b465718"
* Storage has entry "exif.json" for "71cc14a"

## Has no orphan files after purge

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Add file "extractor/images/exif-tags-update.jpg.xmp" as "exif-tags.jpg.xmp"
* Build database
* Purge storage
* Storage has entry "meta.cache" for "5075772"
* Storage has no entry for "b465718"
* Storage has entry "exif.json" for "71cc14a"

## Has orphan files after dry-run purge

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Add file "extractor/images/exif-tags-update.jpg.xmp" as "exif-tags.jpg.xmp"
* Build database
* Purge storage with args "-n"
* Storage has entry "meta.cache" for "5075772"
* Storage has entry "exif.json" for "b465718"
* Storage has entry "exif.json" for "71cc14a"
___
* Stop server