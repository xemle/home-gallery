# HomeGallery

HomeGallery is a web gallery to serve private photos and videos from your local NAS

Note: This software is a private pet/spare time project without any warranty or any
support. Love it or leave it! If you have any problem, fork the project and fix
it by your own. Maybe valuable pull requests are merged if spare time and mood
is available.

[MIT License](https://en.wikipedia.org/wiki/MIT_License)

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
* Serve all your images from multiple source directories (hard drive, camara files, mobile phone files, etc)

## Documentation

See [docs.home-gallery.org](https://docs.home-gallery.org) for general documentation

## General Architecture

The gallery has several components:

* File indexer (short term 'index'): Index of your files and directories state including SHA1 content hashes
* Extractor: Calculates preview files and videos and extracts meta data like exif data, geo reverse lookups, dominant colors, etc.
* Storage: All generated files from the extractor are stored here. These files are also served by the server
* Database builder (short term 'builder'): Based on the index and the storage the gallery database is created
* Web Server (short term 'server'): Serve the database and the previews of the storage
* Web App: Application which runs on the browser
* Events: Manual user actions such as manual tagging
* Exporter: Export a subset as static website to share the subset on a web space

The general workflow is to index your directories -> extract meta data and calculate previews -> build the database -> serve the Web App.

Further features:

- Due the file index the detection of changed media becomes quite fast after the first run
- Once the preview files are generated and mete data are extraced, the original sources are not touched and required any more. So media from offline disk need to be extracted only once and the disk can stay offline on next runs
- Media are identified by their content. Duplicated media (identical files byte-by-byte) are only processed once and renaming is supported without recalulating previews etc.
- With secured https setup the webapp can be used as PWA app on mobile devices
- Tags are supported and such edits are propagated and updated on concurrent sessions
- Reverse image lookup (similar image search) is supported. So if you have one sunset image, you can easily find other sunset photos in your archive without manual tagging

## Requirements

* essential build tools like make or g++
* libvips
* [node](https://nodejs.org)

# External Services and Privacy

The goal of HomeGallery is to use as less public serivces as possible
due sensitive private image data. It tries to use service which can
be deployed local. However the setup requires technical knowlege and
technical maintenance. Following services are called:

For geo reverse lookups (geo coordinates to addess), HomeGallery
queries the [Nominatim Service](https://nominatim.openstreetmap.org/reverse)
from [OpenStreetMap](https://openstreetmap.org). Only geo coordinates
are transmitted.

For reverse image lookups (similar image search), HomeGallery uses the
its own public API at https://api.home-gallery.org. The similarity
image feature uses [TensorflowJS](https://www.tensorflow.org/js). The
tensorflow library requires the AVX CPU instruction which is not
supported on small devices such Raspberry Pis. The API can be run
locally as Docker container, if AVX CPU instruction is supported. See
`api-service` package for details. All preview images are send to this
api.

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
# Link CLI to npm global binaries
npm link
```

## Setup of HomeGallery

Run CLI help by `npx gallery -h` for details

Following basic example is to serve all images and videos from `$HOME/Pictures`. Check [examples folder](examples/README.md) for futher examples.

```
# Media folder to import to the HomeGallery. Change it properly
export SOURCE_DIR=$HOME/Pictures
# Directory for configuration and database files
export CONFIG_DIR=$HOME/.config/home-gallery
# Storage directory of preview files and meta data
export STORAGE_DIR=$HOME/.cache/home-gallery/storage
```

Now index the filesystem, extract preview and meta data and finally build the database

```
# Index filesystem from $SOURCE_DIR and generate SHA1 checksums of files
DEBUG=* npx gallery index -i "$CONFIG_DIR/index.idx" -d "$SOURCE_DIR"
# Generate preview images/videos and extract meta data like EXIF or GEO names. This might take a while
DEBUG=* npx gallery extract -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR"
# Build database for web app
DEBUG=* npx gallery build -i "$CONFIG_DIR/index.idx" -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db"
```

Note: `extract` and `build` can consume multiple indices (multiple media source directories). Use exclude patterns if required.

Than start the HomeGallery web server and visit [localhost:3000](http://localhost:3000)

```
DEBUG=server* npx gallery server -s "$STORAGE_DIR" -d "$CONFIG_DIR/database.db" -e "$CONFIG_DIR/events.db"
```

While the index, previews and database can be reproduced, the only valuable data is the event database which stores manual user actions.

## Development

HomeGallery uses [lerna](https://github.com/lerna/lerna) with multi
packages. Common npm scripts are `clean`, `build`, `watch`.

To run only a subset of packages you can use lerna's
scope feature, e.g build only module `export` and `database`:

```
npm run build -- --scope '@home-gallery/{export,database}'
```

### Web App

The web app can be stared in in development mode with hot reloading.
By default the api requests are proxied to the default local server
http://localhost:3000.

Use `API_PROXY` environment variable to change the api proxy url.

```
API_PROXY=http://localhost:3000 npm run dev
```
