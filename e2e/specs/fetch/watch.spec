# Fetch with watch

Tags: fetch, watch

* Start mock server
* Use file space "remote"
* Init files dir
* Update database
* Start only server

## Basic

* Use file space "local"
* Save database file stat
* Fetch with watch
* Wait for database file stat change
* Save database file stat
* Database has "0" entries

* Use file space "remote"
* Add file "index/images/IMG_20190807_105328.jpg"
* Update database

* Use file space "local"
* Wait for database file stat change
* Database has "1" entries

___
* Stop fetch
* Stop server
* Stderr is empty
