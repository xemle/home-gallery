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

Tags: tree

* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "dead07e165bb37f1812951e37d7b9ca04d57edf9"
* Set user "guest" with password "guest"
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "1b53740c62493ab439dcd8e6a70e2f2ae67ed5f4"
* Set user "admin" with password "admin"
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "10434d2d511659983e12c38baccf5b5d51acd28e"

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