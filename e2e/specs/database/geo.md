# Database geo

Tags: database, geo, addresss

* Start mock server

## Default geo from main file

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Build database
* Database entry "08557f1" has property "latitude" with value "40.25667"
* Database entry "08557f1" has property "longitude" with value "18.44416"
* Database entry "08557f1" has property "altitude" with value "22"
* Database entry "08557f1" has property "city" with value "Nardò"

## Geo from sidecar

DJI_0035.xmp gets priority due its groups all sidecar

* Init dir from "database/date"
* Add file "database/files/DJI_0035.DNG"
* Add file "database/files/DJI_0035.xmp" 
* Build database
* Database entry "08557f1" has property "latitude" with value "-38.66418"
* Database entry "08557f1" has property "longitude" with value "143.10299"
* Database entry "08557f1" has property "altitude" with value "0"
* Database entry "08557f1" has property "city" with value "Princetown"

___
* Stop server