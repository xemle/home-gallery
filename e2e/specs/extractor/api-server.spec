# Extractor: Api Server

Tags: extractor, api

* Start mock server
* Init config
* Set test env

## Disable api server features

* Set config "extractor.apiServer.disable" to "[\"similarDetection\", \"objectDetection\", \"faceDetection\"]"
* Add file "index/images/IMG_20190807_105328.jpg"
* Create index
* Extract files
* Storage has no entry "similarity-embeddings.json" for "2e17e23"
* Storage has no entry "objects.json" for "2e17e23"
* Storage has no entry "faces.json" for "2e17e23"

___
* Stop server