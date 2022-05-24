# Export

Tags: export

* Init dir from "export/basic"

## Basic

* Create export for query ""
* Export file "index.html" exists
* Export file "/app\.[a-f0-9]+\.css/" exists
* Export file "/App\.[a-f0-9]+\.js/" exists
* Export file "api/database.json" exists
* Export file "/fonts\/fa-solid-900\.[a-f0-9]+\.ttf/" exists
* Export file "/fonts\/fa-solid-900\.[a-f0-9]+\.woff2/" exists
* Export file "files/25/d7/b73c43674fec76979c2fef7d09884c1864af-image-preview-1920.jpg" exists
* Export file "files/96/41/9bb03fb2a041ff265e27cfccc4be8b04346d-image-preview-320.jpg" exists

## With query

* Create export for query "96419b"
* Export file "files/25/d7/b73c43674fec76979c2fef7d09884c1864af-image-preview-1920.jpg" does not exist
* Export file "files/96/41/9bb03fb2a041ff265e27cfccc4be8b04346d-image-preview-320.jpg" exists

## With event and query

* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Create export for query "hello"
* Export file "files/25/d7/b73c43674fec76979c2fef7d09884c1864af-image-preview-1920.jpg" does not exist
* Export file "files/96/41/9bb03fb2a041ff265e27cfccc4be8b04346d-image-preview-320.jpg" exists

## With textcache, event and query

Fix bug < 1.4.1 which polluted textcache in the database

* Add file "export/database-with-textcache.db" as "config/database.db" to root
* Append tag event with "hello" for media "96419bb03fb2a041ff265e27cfccc4be8b04346d"
* Create export for query "hello"
* Export file "files/25/d7/b73c43674fec76979c2fef7d09884c1864af-image-preview-1920.jpg" does not exist
* Export file "files/96/41/9bb03fb2a041ff265e27cfccc4be8b04346d-image-preview-320.jpg" exists