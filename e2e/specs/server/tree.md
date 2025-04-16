# Server: Tree api

Tags: server,docker,tree

## Basic

* Init dir from "server/tree-basic"
* Start only server
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "3b33c6d91ae7fb3cb3eef89a6edc1d3b7544d54b"

## With events file

* Init dir from "server/tree-events"
* Start only server
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "56ff7858ead86a7beee71215912eda10f084c0dc"

## Add event

A new userAction event changes the root hash

* Init dir from "server/tree-events"
* Start only server
* Listen to server events
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "56ff7858ead86a7beee71215912eda10f084c0dc"
* Post user event to tag "96419bb03fb2a041ff265e27cfccc4be8b04346d" with "valley"
* Wait for user action event
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "833808c1733078f9e242a56a283bbc67925aaaa7"
___
* Stop server