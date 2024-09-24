# Server with user filter

Tags: server,auth,filter

* Set test env
* Init dir from "server/user-filter"
* Start only server
* Wait for database

## Different users

* Fetch database
* Fetched database has "1" entries
* Set user "guest" with password "guest"
* Fetch database
* Fetched database has "2" entries
* Set user "admin" with password "admin"
* Fetch database
* Fetched database has "3" entries

## Different users with tree API

* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "d99773cdc1b0b264dc194c8f6044e359720320ff"
* Set user "guest" with password "guest"
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "3d1c5290bdde236db11179bbc840f7a431d32fa7"
* Set user "admin" with password "admin"
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "e43f6a2e96a2e541942368ebd010a2e592786c58"

## Different users with app state in index.html

* Request file "/index.html"
* Response has app state with "1" entries
* Set user "guest" with password "guest"
* Request file "/index.html"
* Response has app state with "2" entries
* Set user "admin" with password "admin"
* Request file "/index.html"
* Response has app state with "3" entries

___
* Stop server