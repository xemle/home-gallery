# Server Basic Auth

Tags: server,auth

* Init dir from "database/basic"
* Create database

## Deny database

* Start server with args "--user admin:admin --rule deny:all"
* Set user "admin" with password "admin"
* Wait for database
* Set anonymous user
* Server has file "/favicon.ico"
* Request file "/api/database.json"
* Response status is "401"

## Allow database with user

* Start server with args "--user admin:admin --rule deny:all"
* Set user "admin" with password "admin"
* Wait for database
* Request file "/api/database.json"
* Response status is "200"

## User is logged, auth header is masked

* Start server with args "--user admin:admin --rule deny:all"
* Set user "admin" with password "admin"
* Wait for database
* Request file "/api/database.json"
* Wait for log entry with key "req.user" and value "admin"
* Log has entry with key "req.headers.authorization" and value "*** (masked value)"

## SHA password format

* Start server with args "--user admin:{SHA}0DPiKuNIrrVmD8IUCuw1hQxNqZc= --rule deny:all"
* Set user "admin" with password "admin"
* Wait for database
* Request file "/api/database.json"
* Response status is "200"

## Deny database with invalid credentials

* Start server with args "--user admin:admin --rule deny:all"
* Set user "admin" with password "admin"
* Wait for database
* Set user "admin" with password "other"
* Request file "/api/database.json"
* Response status is "401"
* Set user "other" with password "admin"
* Request file "/api/database.json"
* Response status is "401"

___
* Stop server
