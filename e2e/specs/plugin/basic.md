# Plugin

Tags: plugin

* Start mock server
* Init config
* Add plugin dir to config
* Set test env
* Add file "index/images/IMG_20190807_105328.jpg"

## Create plugin

* Create "vanilla" plugin "acme" with modules "extractor"
* Build plugin "acme"
* Create index
* Extract files
* Storage has entry "acme.json" for "2e17e23"
* Storage has entry "faces.json" for "2e17e23"

## Disabled extractor

* Set config "pluginManager.disabled" to "aiExtractor"
* Create index
* Extract files
* Storage has no entry "similarity-embeddings.json" for "2e17e23"
* Storage has no entry "faces.json" for "2e17e23"
* Storage has no entry "objects.json" for "2e17e23"

## Create database plugin

The default plugin template without extractor sets only
a string `acme` to `plugin.acme`

* Create "vanilla" plugin "acme" with modules "database"
* Build plugin "acme"
* Create index
* Extract files
* Create database
* Database entry "2e17e23" has property "plugin.acme" with value "acme"

## Create plugin with extract and database

The default plugin template with extractor sets data from
the extractor to `plugin.acme`

Tags: typescript

* Create "typescript" plugin "acme" with modules "extractor, database"
* Build plugin "acme"
* Create index
* Extract files
* Create database
* Database entry "2e17e23" has property "plugin.acme.plugin" with value "acme"
