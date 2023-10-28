# Export: Meta

Tags: export,meta

* Start mock server

## Basic

* Add file "export-meta/files/DJI_0035.480.JPG"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta
* File "DJI_0035.480.JPG.xmp" has tags "hello"

## Update existing xmp

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp" as "DJI_0035.480.xmp"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta
* File "DJI_0035.480.xmp" has tags "thing3,hello"

## Import after export

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp"
* Update database
* Database entry "687f920" has property "tags" with value "thing3"
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta
* Update database
* Database entry "687f920" has property "tags" with value "hello,thing3"

## No update on external sidecar add

* Add file "export-meta/files/DJI_0035.480.JPG"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Add file "export-meta/files/DJI_0035.480.JPG.external.xmp" as "DJI_0035.480.JPG.xmp"
* Export meta
* File "DJI_0035.480.JPG.xmp" has tags "external"

## No update on external sidecar change

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Add file "export-meta/files/DJI_0035.480.JPG.external.xmp" as "DJI_0035.480.JPG.xmp"
* Export meta
* File "DJI_0035.480.JPG.xmp" has tags "external"

## Dry run

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta with args "--dry-run"
* File "DJI_0035.480.JPG.xmp" has tags "thing3"

## Changes after

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp"
* Add file "export-meta/changes-after/database.db" as "config/database.db" to root
* Add file "export-meta/changes-after/events.db" as "config/events.db" to root
* Create index
* Export meta with args "--changes-after 2023-09-04"
* File "DJI_0035.480.JPG.xmp" has tags "thing3"

## Create multiple sidecars for same files

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG" as "2019/DJI_0035.480.JPG"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta
* File "DJI_0035.480.JPG.xmp" has tags "hello"
* File "2019/DJI_0035.480.JPG.xmp" has tags "hello"

## No sidecar creation for empty meta data

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/empty-meta/database.db" as "config/database.db" to root
* Add file "export-meta/empty-meta/events.db" as "config/events.db" to root
* Create index
* Export meta
* Last command succeeded
* File "DJI_0035.480.JPG.xmp" does not exist

## No sidecar update for empty meta data

* Add file "export-meta/files/DJI_0035.480.JPG"
* Add file "export-meta/files/DJI_0035.480.JPG.xmp"
* Update database
* Append tag event with "hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Append tag event with "-hello" for media "687f920f08a3392d4d189e1cb499006aea7f1ede"
* Export meta
* Last command succeeded
* File "DJI_0035.480.JPG.xmp" has tags "thing3"

___
* Stop server