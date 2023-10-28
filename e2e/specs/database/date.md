# Database date

Tags: database, date

* Start mock server

## Default Date

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Add file "database/files/DJI_0035.JPG"
* Build database
* Database entry "08557f1" has property "date" with value "2019-04-28T08:48:49.000Z"

## Date by group sidecar

DJI_0035.xmp gets priority due its groups all sidecar

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Add file "database/files/DJI_0035.DNG.xmp"
* Add file "database/files/DJI_0035.JPG"
* Add file "database/files/DJI_0035.JPG.xmp"
* Add file "database/files/DJI_0035.xmp" 
* Build database
* Database entry "08557f1" has property "date" with value "2019-04-29T02:48:49.000Z"

## Date by main file sidecar

If no group sidecar exists take the meta sidecar of the largest file which is DJI_0035.DNG.xmp

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Add file "database/files/DJI_0035.DNG.xmp"
* Add file "database/files/DJI_0035.JPG"
* Add file "database/files/DJI_0035.JPG.xmp"
* Build database
* Database entry "08557f1" has property "date" with value "2019-04-27T06:28:49.000Z"

## Date by any meta sidecar

Any date from a meta sidecar gets priority

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Add file "database/files/DJI_0035.JPG"
* Add file "database/files/DJI_0035.JPG.xmp"
* Build database
* Database entry "08557f1" has property "date" with value "2019-04-26T04:18:49.000Z"

___
* Stop server