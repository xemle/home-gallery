# Server

Tags: server,docker

## Serve

* Init dir from "database/basic"
* Create database
* Start server
* Server has file "/index.html"
* Server has file "/api/database.json"

## Database query

* Init dir from "database/basic"
* Create database
* Start server
* Fetch database with query "?q=2018-01-10"
* Fetched database has "1" entries

## Database event query

* Init dir from "database/basic"
* Create database
* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Start server
* Fetch database with query "?q=hello"
* Fetched database has "1" entries
* Fetched database with entry "0" has no property "textCache"
___
* Stop server
