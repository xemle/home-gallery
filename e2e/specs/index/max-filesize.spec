# File index option: max-filesize

Tags: index, option, filesize

* Init files from "index/basic"

## Limit filesize to 4 MB

* Create index with args "--max-filesize 4M"
* Index has "1" entries
* Index has entry "IMG_20180110_113953.jpg" with checksum "25d7b73c43674fec76979c2fef7d09884c1864af"

## Limit filesize to 4 MB and keep known files as default

* Create index
* Index has "2" entries
* Create index with args "--max-filesize 4M"
* Index has "2" entries
* Index has entry "IMG_20180110_113953.jpg" with checksum "25d7b73c43674fec76979c2fef7d09884c1864af"
* Index has entry "IMG_2915.JPG" with checksum "96419bb03fb2a041ff265e27cfccc4be8b04346d"

## Limit filesize to 4 MB and keep known files

* Create index
* Index has "2" entries
* Create index with args "--max-filesize 4M --keep-known"
* Index has "2" entries

## Limit filesize to 4 MB and and drop known files

* Create index
* Index has "2" entries
* Create index with args "--max-filesize 4M --no-keep-known"
* Index has "1" entries
* Index has entry "IMG_20180110_113953.jpg" with checksum "25d7b73c43674fec76979c2fef7d09884c1864af"

