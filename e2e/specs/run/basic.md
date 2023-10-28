# Run actions

Tags: run

* Init files from "index/basic"
* Set test env
* Init config

## Initial Import

Tags: docker

* Run intital import
* Database has "2" entries
* Database entry "96419bb" has property "type" with value "image"
* Database entry "25d7b73" has property "type" with value "image"

## Update import

Tags: docker

* Run update import
* Database has "2" entries
* Database entry "96419bb" has property "type" with value "image"
* Database entry "25d7b73" has property "type" with value "image"

## Import all sources

Tags: docker

* Run full import
* Database has "2" entries
* Database entry "96419bb" has property "type" with value "image"
* Database entry "25d7b73" has property "type" with value "image"

## Update import in watch mode

The step wait for watch idle uses pid of the process. On binary caxa does
not forward the USR1 signal to the proces which is used to detect idle state

Tags: watch,skipBinary

* Save database file stat
* Run import in watch mode
* Wait for watch for idle
* Database has "2" entries
* Database entry "96419bb" has property "tags" with value ""
* Save database file stat
* Add file "extractor/images/exif-tags.jpg.xmp" as "IMG_2915.JPG.xmp"
* Wait for watch for idle
* Database has "2" entries
* Database entry "96419bb" has property "tags" with value "thing3"

___
* Stop import
