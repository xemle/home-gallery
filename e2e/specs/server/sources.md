# Server: Sources

Tags: server,sources,download

* Start mock server
* Set test env
* Init config

## Basic

* Set config "sources[0].downloadable" to "true"
* Add file "index/images/DJI_0035.JPG"
* Update database
* Start only server
* Request file "/api/sources"
* Response body has property "data[0].indexName" with value "files"
* Request file "/api/sources/files/DJI_0035.JPG"
* Response status is "200"
* Response content type is "image/jpeg"

## Not found

* Set config "sources[0].downloadable" to "true"
* Add file "index/images/DJI_0035.JPG"
* Update database
* Start only server
* Request file "/api/sources/files/unknown.JPG"
* Response status is "404"

___
* Stop server