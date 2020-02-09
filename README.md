# Cloud Gallery

Clould Gallery is a web gallery to serve private photos and videos from your local NAS

Note: This software is a spare time project without any warranty or any support. Take it or leave it! If you have any problem, fork the project and fix it by your own. Maybe valuable pull requests are merged if spare time and mood is available.

## Target Users

* Linux affine users who solve their own problems, familiar with git and node
* Serve your local data without usage of cloud services
* One user only - all files are served
* Watch your photos and videos from mobile phone

## General Architecture

The gallery has several components:

* File indexer (short term 'index'): Index of your files and directories state including SHA1 content hashes. Renaming and moving files is possible
* Extractor: Calculates preview files and videos and extracts meta data like exif data, geo reverse lookups, dominant colors, etc.
* Storage: All generated files from the Extractor are stored here
* Database builder (short term 'builder'): Based on the index and the storage the gallery database is created
* Web Server (short term 'server'): Serve the database and the previews of the storage
* Web App: Application which runs on the browser

The general workflow is to index your directories -> extract meta data and calculate previews -> build the database -> serve the Web App.

## Setup Cloud Gallery

See `node index.js -h` for details

```
export PICTURES_DIR=$HOME/Pictures
export GALLERY_HOME=./data
export PICTURES_INDEX=$GALLERY_HOME/home-pictures.idx
export STORAGE_DIR=$GALLERY_HOME/storage
export DATABASE=$GALLERY_HOME/catalog.db
```

index, extract, build and serve the Cloud Gallery

```
npm install
DEBUG=* node index.js index -i $PICTURES_INDEX -d $PICTURES_DIR -c
DEBUG=* node index.js extract -i $PICTURES_INDEX -s $STORAGE_DIR
DEBUG=* node index.js build -i $PICTURES_INDEX -s $STORAGE_DIR -d $DATABASE
DEBUG=* node index.js serve -s $STORAGE -d $DATABASE
```

Note: `extract` and `build` consume multiple indices (multiple media source directories). Use exclude patterns if required.

## Development

### Web App

```
API_PROXY=http://localhost:3000 npm run dev
```

```
API_PROXY=http://api.host:3000 npm run dev
```
