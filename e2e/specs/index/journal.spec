# File index option: journal

Tags: index, option, journal

* Add file "README.md" with content "# Readme"
* Add file "index.md" with content "# App"

## Create index with journal

* Create index with args "--journal abc"
* Exit code was "0"
* Journal "abc" has entries of "2" adds, "0" changes and "0" removals

## Add file

* Create index
* Add file "TODO.md" with content "# Todo"
* Create index with args "--journal abc"
* Journal "abc" has entries of "1" adds, "0" changes and "0" removals

## Remove file

* Create index
* Remove file "index.md"
* Update index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "0" changes and "1" removals

## Rename file

* Create index
* Rename file "index.md" to "renamed.md"
* Update index with args "--journal abc"
* Journal "abc" has entries of "1" adds, "0" changes and "1" removals

## Overwrite file

* Create index
* Add file "index.md" with content "# TODO\n* Write tests"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "1" changes and "0" removals
* Journal "abc" entry "index.md" in "changes" has checksum "da5014965535f9703408cb61407112c05c3b79cb"
* Journal "abc" entry "index.md" in "changes" has prev checksum "9fc4ebc6fc993ebf08efb6d7a02a1fceda59e561"

## New checksum

* Create index with args "--no-checksum"
* Create index with args "--journal abc"
* Journal "abc" has entries of "0" adds, "2" changes and "0" removals
* Journal "abc" entry "README.md" in "changes" has checksum "cd0c0890b92695037143c16c5bee6d098bafcc76"
* Journal "abc" entry "index.md" in "changes" has checksum "9fc4ebc6fc993ebf08efb6d7a02a1fceda59e561"

## Delete journal

* Create index with args "--journal abc"
* Journal "abc" exists
* Delete journal "abc"
* Journal "abc" does not exist
