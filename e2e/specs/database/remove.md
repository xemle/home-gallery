# Database: Remove

Tags: database, remove

Events adds tag 'hello' to entry 96419bb

## Initial state

* Init dir from "database/remove"
* Database has "2" entries
* Database entry "96419bb" has property "tags" with value "[one]"
* Database entry "25d7b73" has property "tags" with value "[two]"

## Remove by query

* Init dir from "database/remove"
* Remove database entries by query "hello"
* Database has "1" entries
* Database entry "25d7b73" has property "tags" with value "[two]"

## Events should not pollute database on remove command

* Init dir from "database/remove"
* Remove database entries with args "--keep" by query "hello"
* Database has "1" entries
* Database entry "96419bb" has property "tags" with value "[one]"

## Keep by query

* Init dir from "database/remove"
* Remove database entries with args "--keep" by query "hello"
* Database has "1" entries
* Database entry "96419bb" has property "tags" with value "[one]"

## Dry run

* Init dir from "database/remove"
* Remove database entries with args "--dry-run" by query "hello"
* Database has "2" entries
* Database entry "96419bb" has property "tags" with value "[one]"
* Database entry "25d7b73" has property "tags" with value "[two]"

## Without events

* Init dir from "database/remove"
* Remove database entries without events by query "hello"
* Database has "2" entries
* Database entry "96419bb" has property "tags" with value "[one]"
* Database entry "25d7b73" has property "tags" with value "[two]"

## With config

* Init dir from "database/remove-config"
* Init config
* Set test env
* Remove database entries with config by query "hello"
* Database has "1" entries
* Database entry "25d7b73" has property "tags" with value "[two]"
