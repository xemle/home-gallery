# File index option: journal with sidecar

Tags: index, option, journal, sidecar

## Add sidecar file

* Add file "IMG_1234.jpg" with content "Main content"
* Create index
* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index with args "--journal abc"
* Journal "abc" has entries of "1" adds, "1" changes and "0" removals

## Change sidecar file

* Add file "IMG_1234.jpg" with content "Main content"
* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index
* Add file "IMG_1234.jpg.xmp" with content "Tag2"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "2" changes and "0" removals

## Remove sidecar file

* Add file "IMG_1234.jpg" with content "Main content"
* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index
* Remove file "IMG_1234.jpg.xmp"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "1" changes and "1" removals

## Add main file

* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index
* Add file "IMG_1234.jpg" with content "Main content"
* Create index with args "--journal abc"
* Journal "abc" has entries of "1" adds, "1" changes and "0" removals

## Change main file

* Add file "IMG_1234.jpg" with content "Main content"
* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index
* Add file "IMG_1234.jpg" with content "Main other content"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "2" changes and "0" removals

## Remove main file

* Add file "IMG_1234.jpg" with content "Main content"
* Add file "IMG_1234.jpg.xmp" with content "Tag"
* Create index
* Remove file "IMG_1234.jpg"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "1" changes and "1" removals
