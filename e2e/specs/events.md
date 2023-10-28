# Events

Tags: events

## 404 on Empty

* Start server from "database/basic"
* Fetching events has status "404"

## Append first event

* Start server from "database/basic"
* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetching events has status "200"

## Post first event

* Start server from "database/basic"
* Post tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Fetching events has status "200"
* Event database has "1" events

___
* Stop server
* Stderr is empty