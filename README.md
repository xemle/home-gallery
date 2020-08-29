# Home Gallery

Home Gallery is a web gallery to serve private photos and videos from your local NAS

Note: This software is a private pet/spare time project without any warranty or any
support. Love it or leave it! If you have any problem, fork the project and fix
it by your own. Maybe valuable pull requests are merged if spare time and mood
is available.

MIT License

## Motivation

* The source of all my private images and videos are stored local on my NAS at home
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

* File indexer (short term 'index'): Index of your files and directories state including SHA1 content hashes
* Extractor: Calculates preview files and videos and extracts meta data like exif data, geo reverse lookups, dominant colors, etc.
* Storage: All generated files from the extractor are stored here
* Database builder (short term 'builder'): Based on the index and the storage the gallery database is created
* Web Server (short term 'server'): Serve the database and the previews of the storage
* Web App: Application which runs on the browser
* Events: Manual user actions such as manual tagging

The general workflow is to index your directories -> extract meta data and calculate previews -> build the database -> serve the Web App.

Further features:

- Due the file index the detection of changed media becomes quite fast after the first run
- Once the preview files are generated and mete data are extraced, the original sources are not touchted and required any more. So media from offline disk need to be extracted only once and the disk can stay offline on next runs
- Media are identified by their content. Duplicated media (identical files byte-by-byte) are only processed once and renaming is supported without recalulating previews etc.
- With secured https setup the webapp can be used as PWA app on mobile devices
- Tags are supported and such edits are propagated and updated on concurrent sessions
- Similarity detection of images is supported. So if you have one sunset image, you can easily find other sunset photos in your archive

## Requirements

* [node](https://nodejs.org)

## Limits

The complete "database" is loaded into the browser. My 100.000 media are about 100 MB plain JSON and 12 MB compressed JSON. The performance is quite good on current mobile device. Futher experiences with larger datasets do not exists. Feedback is welcome.

## Installation

```
# Install required packages
npm install
# Bootstrap packages of mono repository
npm run bootstrap
# Build required modules
npm run build
```

## Setup Home Gallery

Run CLI help by `node index.js -h` for details

Example to serve all images and videos from `$HOME/Pictures`

```
export SOURCE_DIR=$HOME/Pictures
export GALLERY_HOME=$HOME/.config/home-gallery
export SOURCE_INDEX=$GALLERY_HOME/home-pictures.idx
export DATABASE=$GALLERY_HOME/catalog.db
export EVENTS=$GALLERY_HOME/events.db
export STORAGE_DIR=$HOME/.local/opt/home-gallery-storage
```

Now index, extract, build and serve the Home Gallery

```
# Save current date to extract only new files
CHECKSUM_FROM=$(date -uIseconds)
# Index filesystem and generate SHA1 sums of files
DEBUG=* node index.js index -i $SOURCE_INDEX -d $SOURCE_DIR -c
# Generate preview images/videos and extract meta data like EXIF or GEO names
DEBUG=* node index.js extract -i $SOURCE_INDEX -s $STORAGE_DIR -C "$CHECKSUM_FROM"
# Build database for web app
DEBUG=* node index.js build -i $SOURCE_INDEX -s $STORAGE_DIR -d $DATABASE
# Serve gallery
DEBUG=server* node index.js serve -s $STORAGE -d $DATABASE -e $EVENTS
```

Note: `extract` and `build` can consume multiple indices (multiple media source directories). Use exclude patterns if required.

While the index, previews and database can be reproduced, the only valuable data is the event database which stores manual user actions.

## Development

### Web App

```
API_PROXY=http://localhost:3000 npm run dev
```

```
API_PROXY=http://api.host:3000 npm run dev
```
