# Server Prefix

Tags: server,prefix

* Init dir from "database/basic"
* Create database

## Enable prefix

* Start server with args "--prefix gallery"
* Server has file "/gallery/favicon.ico"
* Wait for file "/gallery/api/database.json"

## Redirect to prefix

* Start server with args "--prefix gallery"
* Request file "/"
* Response status is "302"
___
* Stop server
