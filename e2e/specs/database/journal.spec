# Database option: journal

Tags: database, option, journal

## Initial database

* Init dir from "database/journal"
* Add file "index/basic/IMG_20180110_113953.jpg"
* Add file "index/basic/IMG_2915.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries

## Double initial database

* Init dir from "database/journal"
* Add file "index/basic/IMG_20180110_113953.jpg"
* Add file "index/basic/IMG_2915.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries

## No changes keeps database

* Init dir from "database/journal"
* Add file "index/basic/IMG_20180110_113953.jpg"
* Add file "index/basic/IMG_2915.JPG"
* Create index
* Create database
* Save database file stat
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database file stat are unchanged

## Add file

* Prepare journal from "database/journal"
* Add file "index/images/DJI_0035.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "3" entries

## Add file to other path

* Prepare journal from "database/journal"
* Add file "index/basic/IMG_2915.JPG" as "other/IMG_2915.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries
* Database entry "96419bb" has "2" files
* Database entry "96419bb" has file "IMG_2915.JPG"
* Database entry "96419bb" has file "other/IMG_2915.JPG"

## Remove file

* Prepare journal from "database/journal"
* Remove file "IMG_2915.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "1" entries

## Remove one of two same files

* Prepare journal from "database/journal"
* Add file "index/basic/IMG_2915.JPG" as "other/IMG_2915.JPG"
* Create index
* Create database
* Remove file "IMG_2915.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries
* Database entry "96419bb" has "1" files
* Database entry "96419bb" has file "other/IMG_2915.JPG"

## Rename file

* Prepare journal from "database/journal"
* Rename file "IMG_2915.JPG" to "renamed.JPG"
* Create index with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries
* Database entry "96419bb" has "1" files
* Database entry "96419bb" has file "renamed.JPG"

## Overwrite file

* Prepare journal from "database/journal"
* Add file "index/images/DJI_0035.JPG" as "IMG_2915.JPG"
* Create index with args "--journal abc"
* Extract files with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries
* Database entry "e928ea5" has "1" files
* Database entry "e928ea5" has file "IMG_2915.JPG"

## Overwrite same file

* Prepare journal from "database/journal"
* Add file "index/basic/IMG_20180110_113953.jpg"
* Create index with args "--journal abc"
* Extract files with args "--journal abc"
* Create database with args "--journal abc"
* Database has "2" entries
* Database entry "25d7b73" has "1" files
* Database entry "25d7b73" has file "IMG_20180110_113953.jpg"
