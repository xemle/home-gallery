# Database Sidecar Handling

Tags: database, sidecar

* Start mock server

## Init without sidecar

* Add file "extractor/images/exif-tags.jpg"
* Create index
* Extract files
* Create database
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "thing1,thing2"

## Init with sidecar

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3"

## Add sidecar

Tags: journal

* Add file "extractor/images/exif-tags.jpg"
* Build database
* Add file "extractor/images/exif-tags.jpg.xmp"
* Update database with journal
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3"

## Edit sidecar

Tags: journal

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Add file "extractor/images/exif-tags-update.jpg.xmp" as "exif-tags.jpg.xmp"
* Update database with journal
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3,thing4"

## Remove sidecar

Tags: journal

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.jpg.xmp"
* Build database
* Remove file "exif-tags.jpg.xmp"
* Update database with journal
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "thing1,thing2"

## Add main file

Tags: journal

* Add file "extractor/images/exif-tags.small.jpg"
* Build database
* Add file "extractor/images/exif-tags.jpg"
* Update database with journal
* Database has "1" entries
* Database entry "3624e37" has property "tags" with value "other,thing1,thing2"

## Remove main file

Tags: journal

* Add file "extractor/images/exif-tags.jpg"
* Add file "extractor/images/exif-tags.small.jpg"
* Build database
* Remove file "exif-tags.jpg"
* Update database with journal
* Database has "1" entries
* Database entry "94b7a44" has property "tags" with value "other"

## Add multiple files in different folders

Tags: journal

Check fix with merge of adds and changes. It needs to be sorted
by directory and files so that sidecars are matched correctly. It
checks that multiple changes across directories can be handled.

* Add file "extractor/images/exif-tags.jpg" as "d1/image1.jpg"
* Add file "extractor/images/exif-tags.small.jpg" as "d2/image2.jpg"
* Build database
* Add file "extractor/images/exif-tags.jpg.xmp" as "d1/image1.jpg.xmp"
* Add file "extractor/images/exif-tags-update.jpg.xmp" as "d2/image2.xmp"
* Update database with journal
* Database has "2" entries
* Database entry "94b7a44" has property "tags" with value "other,thing3,thing4"
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3"

___
* Stop server