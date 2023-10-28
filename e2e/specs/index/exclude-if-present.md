# File index option: excludeIfPresent

Tags: index, option, excludeIfPresent

* Add file "d1/f1" with content "# File 1"
* Add file "d2/f2" with content "# File 2"
* Add file "d2/.galleryignore" with content ""

## Create index with exclude marker

* Create index with args "--exclude-if-present .galleryignore"
* Index has "4" entries

## Create index with not matching exclude marker

* Create index with args "--exclude-if-present .otherignore"
* Index has "5" entries

## Create new exclude marker

* Create index with args "--exclude-if-present .galleryignore"
* Add file "d1/.galleryignore" with content ""
* Create index with args "--exclude-if-present .galleryignore"
* Index has "4" entries
