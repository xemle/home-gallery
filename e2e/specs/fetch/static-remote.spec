# Fetch from static

Tags: fetch,static,remote

## Fail incompatible database from remote

* Use file space "remote"
* Init dir from "fetch/invalid-database"
* Start static server
* Use file space "local"
* Fetch
* Last command failed
* Database does not exist

## Skip incompatible events from remote

* Use file space "remote"
* Init dir from "fetch/invalid-events"
* Start static server
* Use file space "local"
* Append tag event with "world" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetch
* Event database has "1" events

___
* Stop server
* Stderr is empty