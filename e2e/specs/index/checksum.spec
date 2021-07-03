# File index option: checksum

Tags: index, option, checksum

* Init files from "index/basic"

## No checksum

* Create index with args "--no-checksum"
* Index has "2" entries
* Index has entry "IMG_20180110_113953.jpg" with checksum ""
* Index has entry "IMG_2915.JPG" with checksum ""

## Create checksum on update

* Create index with args "--no-checksum"
* Update index
* Index has "2" entries
* Index has entry "IMG_20180110_113953.jpg" with checksum "25d7b73c43674fec76979c2fef7d09884c1864af"
* Index has entry "IMG_2915.JPG" with checksum "96419bb03fb2a041ff265e27cfccc4be8b04346d"
