# Home Gallery

Home Gallery is a web gallery to serve private photos and videos from your local NAS

Note: This software is a spare time project without any warranty or any
support. Take it or leave it! If you have any problem, fork the project and fix
it by your own. Maybe valuable pull requests are merged if spare time and mood
is available.

MIT License

## Motivation

* The source of all my private images and videos are stored on my local NAS at home
* Cloud service do not cover my privacy concerns
* All gallery software are lacking to have a fast user experience on mobile phones
* The gallery software should help to browse or discover forgotten memories from the image archive

## Target Users

* Linux/Unix affine users who solve their own problems, familiar with shell, git and node
* Serve your local data without usage of cloud services
* One user only - all files are served
* Watch your photos and videos from mobile phone
* Serve all your images from multiple SOURCE (hard drive, camara files, mobile phone files, etc)

## General Architecture

The gallery has several components:

* File indexer (short term 'index'): Index of your files and directories state including SHA1 content hashes. Renaming and moving files is possible
* Extractor: Calculates preview files and videos and extracts meta data like exif data, geo reverse lookups, dominant colors, etc.
* Storage: All generated files from the Extractor are stored here
* Database builder (short term 'builder'): Based on the index and the storage the gallery database is created
* Web Server (short term 'server'): Serve the database and the previews of the storage
* Web App: Application which runs on the browser

The general workflow is to index your directories -> extract meta data and calculate previews -> build the database -> serve the Web App.

## Requirements

* [node](https://nodejs.org)

## Installation

```
# Install required packages
npm install
npx lerna bootstrap
# Build required filed
npm run build
```

## Setup Home Gallery

See `node index.js -h` for details

The example serves all images and videos from $HOME/SOURCE

```
export SOURCE_DIR=$HOME/Pictures
export GALLERY_HOME=./data
export SOURCE_INDEX=$GALLERY_HOME/home-pictures.idx
export STORAGE_DIR=$GALLERY_HOME/storage
export DATABASE=$GALLERY_HOME/catalog.db
```

Now index, extract, build and serve the Home Gallery

```
# Index filesystem and generate SHA1 sums of files
DEBUG=* node index.js index -i $SOURCE_INDEX -d $SOURCE_DIR -c
# Generate preview images/videos and extract meta data like EXIF or GEO names
DEBUG=* node index.js extract -i $SOURCE_INDEX -s $STORAGE_DIR
# Build database for web app
DEBUG=* node index.js build -i $SOURCE_INDEX -s $STORAGE_DIR -d $DATABASE
# Serve gallery
DEBUG=server* node index.js serve -s $STORAGE -d $DATABASE
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
