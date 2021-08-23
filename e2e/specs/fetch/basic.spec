# Fetch

Tags: fetch

* Use file space "remote"
* Start server from "database/basic"
* Wait for database

## From empty

* Use file space "local"
* Fetch
* Database has "2" entries
* Storage has entry "image-preview-128.jpg" for "25d7b73"
* Storage has entry "image-preview-1920.jpg" for "96419bb"

## Init events from remote

* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Use file space "local"
* Fetch
* Event database has "1" events

## Add events from remote

* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Use file space "local"
* Append tag event with "world" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetch
* Event database has "2" events

## Do not add events twice

* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Use file space "local"
* Fetch
* Fetch
* Event database has "1" events

## Fetch with query

* Post tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Use file space "local"
* Fetch with args "-q hello"
* Database has "1" entries
* Storage has no entry for "25d7b73"
* Storage has entry "image-preview-1920.jpg" for "96419bb"

___
* Stop server
* Stderr is empty