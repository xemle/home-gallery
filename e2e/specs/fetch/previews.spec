# Fetch: Preview files

Tags: fetch,static,remote,preview

* Use file space "remote"
* Init dir from "fetch/static"
* Start static server
* Use file space "local"

## Existing storage files are not overwritten

* Init dir from "fetch/force-download"
* Storage entry "image-preview-1920.jpg" for "25d7b73" has file size "0"
* Database has "1" entries
* Fetch
* Database has "2" entries
* Storage entry "image-preview-1920.jpg" for "25d7b73" has file size "0"

## Force download

Local files have all the filesize of 0. Force download fixes the previews for missing entries

* Init dir from "fetch/force-download"
* Storage entry "image-preview-1920.jpg" for "96419bb" has file size "0"
* Storage entry "image-preview-1920.jpg" for "25d7b73" has file size "0"
* Fetch with args "--force-download"
* Storage entry "image-preview-1920.jpg" for "96419bb" has file size "0"
* Storage entry "image-preview-1920.jpg" for "25d7b73" has file size "194105"

## Download all

All files are downloaded, not only from missing entries

* Init dir from "fetch/download-all"
* Storage has no entry for "96419bb"
* Storage has no entry for "25d7b73"
* Fetch with args "--download-all"
* Storage entry "image-preview-1920.jpg" for "96419bb" has file size "458879"
* Storage entry "image-preview-1920.jpg" for "25d7b73" has file size "194105"

___
* Stop server
* Stderr is empty