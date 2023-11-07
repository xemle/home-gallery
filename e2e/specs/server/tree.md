# Server: Tree api

Tags: server,docker,tree

## Basic

* Init dir from "server/tree-basic"
* Start only server
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "c050881852dd1f8249bbda71020780745f9c7774"

## With events file

* Init dir from "server/tree-events"
* Start only server
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "5e368675e1e6bb31ec5914021f41b8e954ff8517"

## Add event

A new userAction event changes the root hash

* Init dir from "server/tree-events"
* Start only server
* Listen to server events
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "5e368675e1e6bb31ec5914021f41b8e954ff8517"
* Post user event to tag "96419bb03fb2a041ff265e27cfccc4be8b04346d" with "valley"
* Wait for user action event
* Request file "/api/database/tree/root.json"
* Response body has property "hash" with value "c9053e08046ed65ede9e433bb0b342c2b11e931d"
___
* Stop server