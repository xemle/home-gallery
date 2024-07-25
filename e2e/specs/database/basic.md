# Database

Tags: database

* Start mock server

## Create

* Init dir from "database/basic"
* Create database
* Database has "2" entries
* Database entry "96419bb" has property "width" with value "6000"
* Database entry "96419bb" has property "height" with value "4000"
* Database entry "96419bb" has property "city" with value "Bühl"
* Database entry "25d7b73" has property "type" with value "image"
* Database entry "25d7b73" has property "date" with value "2018-01-10T10:39:53.790Z"

## Add file to other path

* Prepare journal from "database/basic"
* Add file "index/basic/IMG_2915.JPG" as "other/IMG_2915.JPG"
* Create index
* Create database
* Database has "3" entries

## Small Image Should Have Preview Files

* Add file "index/images/DJI_0035.640.JPG"
* Build database
* Database has "1" entries
* Database entry "e3e4ce1" has property "previews[0]" with value "e3/e4/ce154ada1e399396726630d9706d8fff1fd8-image-preview-320.jpg"
* Database entry "e3e4ce1" has property "previews[1]" which matches "/image-preview-128.jpg/"
* Database entry "e3e4ce1" has no property "previews[2]"

___
* Stop server