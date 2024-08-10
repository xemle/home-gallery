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