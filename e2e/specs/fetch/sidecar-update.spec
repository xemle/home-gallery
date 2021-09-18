# Fetch: Sidecar updates

Tags: fetch, sidecar

* Start mock server
* Use file space "remote"
* Init server from "fetch/sidecar-update"

## Fetch remote sidecar change

* Use file space "local"
* Fetch
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3"
* Use file space "remote"
* Add file "fetch/files/exif-tags-update.jpg.xmp" as "exif-tags.jpg.xmp"
* Update database with journal
* Wait for current database
* Use file space "local"
* Fetch
* Database entry "3624e37" has property "tags" with value "thing1,thing2,thing3,thing4"

___
* Stop server