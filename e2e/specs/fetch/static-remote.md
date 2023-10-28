# Fetch from static

Tags: fetch,static,remote

## Fail incompatible database from remote

* Use file space "remote"
* Init dir from "fetch/incompatible-database"
* Start static server
* Use file space "local"
* Fetch
* Last command failed
* Database does not exist

## Skip incompatible events from remote

* Use file space "remote"
* Init dir from "fetch/incompatible-events"
* Start static server
* Use file space "local"
* Append tag event with "world" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetch
* Database has "2" entries
* Event database has "1" events

## Skip invalid events from remote

* Use file space "remote"
* Init dir from "fetch/invalid-events"
* Start static server
* Use file space "local"
* Append tag event with "world" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetch
* Database has "2" entries
* Event database has "1" events

## Remote without events

* Use file space "remote"
* Init dir from "fetch/no-events"
* Start static server
* Use file space "local"
* Append tag event with "world" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetch
* Database has "2" entries
* Event database has "1" events

## Static with query

* Use file space "remote"
* Init dir from "fetch/static"
* Start static server
* Use file space "local"
* Fetch with args "-q hello"
* Database has "1" entries
* Event database has "1" events
* Storage has no entry for "25d7b73"
* Storage has entry "image-preview-1920.jpg" for "96419bb"

___
* Stop server
* Stderr is empty