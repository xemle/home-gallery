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

## With whitespace

* Set config "sources[0].downloadable" to "true"
* Add file "index/images/DJI_0035.JPG" as "2025-02-22 Camera Roll/DJI_0035.JPG"
* Update database
* Start only server
* Request file "/api/sources/files/2025-02-22%20Camera%20Roll/DJI_0035.JPG"
* Response status is "200"
* Response content type is "image/jpeg"

## With basePath

* Set config "sources[0].downloadable" to "true"
* Set config "server.prefix" to "/gallery"
* Add file "index/images/DJI_0035.JPG"
* Update database
* Start only server
* Request file "/gallery/api/sources"
* Response body has property "data[0].indexName" with value "files"
* Request file "/gallery/api/sources/files/DJI_0035.JPG"
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