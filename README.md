![HomeGallery hero image](https://home-gallery.org/hero.png "self-hosted open-source web gallery")

# HomeGallery

[Home-Gallery.org](https://home-gallery.org) is a self-hosted open-source web gallery
to browse personal photos and videos featuring tagging, mobile-friendly, and AI
powered image and face discovery. Try the [demo gallery](https://demo.home-gallery.org)
or enjoy the [food images](https://demo.home-gallery.org/similar/c7f8a3bf0142fc9694f517c23e42d988c97233c3)!

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

See [docs.home-gallery.org](https://docs.home-gallery.org) for general documentation. The general
architecture is described [here](https://docs.home-gallery.org/internals/index.html).

## Features

- Due the file index the detection of changed media becomes quite fast after the first run
- Once the preview files are generated and mete data are extraced, the original sources are not touched and required any more. So media from offline disk need to be extracted only once and the disk can stay offline on next runs
- Media are identified by their content. Duplicated media (identical files byte-by-byte) are only processed once and renaming is supported without recalulating previews etc.
- With secured https setup the webapp can be used as PWA app on mobile devices
- Tags are supported and such edits are propagated and updated on concurrent sessions
- Reverse image lookup (similar image search) is supported. So if you have one sunset image, you can easily find other sunset photos in your archive without manual tagging

## Limits

The complete "database" is loaded into the browser. My 100.000 media are about
100 MB plain JSON and 12 MB compressed JSON. The performance is quite good on
current mobile device. A user reported a successful setup with over 400.000
media files. Further feedback is welcome.

## Requirements

* essential build tools like make or g++
* libvips
* [node](https://nodejs.org)

## Installation

```
# Install required packages
npm install
# Bootstrap packages of mono repository
npm run bootstrap
# Build required modules
npm run build
```

## Configure HomeGallery

Copy `gallery.config-example.yml` to `gallery.config.yml` and configure
`gallery.config.yml` with source media directories and other settings.

A bare minimal configuration is

```
sources:
  - dir: ~/Pictures
```

to include all images and videos from your `$HOME/Pictures` directory. The previews
are stored in `~/.cache/home-gallery/storage` and the configuration files like
file index, database, events are stored in `~/.config/home-gallery` directory.

A more advance configuration would be

```
baseDir: /mnt/gallery
confDir: '{baseDir}/config'
sources:
  - dir: /mnt/media
    index: '{confDir}/mnt-media.idx
    exclude:
      - *.CR2
      - *.cr2
  - dir: ~/Pictures
    index: '{confDir}/{basename(dir)}.idx'
storage:
  dir: '{baseDir}/storage'
server:
  port: 8080
  host: '0.0.0.0'
  key: '{confDir}/server.key'
  cert: '{confDir}/server.crt'
```

to use media files from directories `/mnt/media` and `$HOME/Pictures`. The gallery
files are stored on a separate partition `/mnt/gallery`. The storage directory is
`/mnt/gallery/storage` and other gallery configuration files are located at
`/mnt/gallery/config`. The server uses https on port 8080.

See [gallery.config-example.yml](gallery.config-example.yml) for more configuration details.

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
its own public API at https://api.home-gallery.org. This public API supports
low powered devices such as the SoC Raspberry PI and all preview images are
send to this public API by default. No images or privacy data are kept.

The API can be configured and ran also locally or as Docker container. See
`api-service` package for further information.

## Run HomeGallery

Run `./gallery.js` (or `node gallery`) to

- update and process media files
- start the web server
- update the gallery application (requires git)

Use different configurations by `--config <file>` parameter. E.g. `./gallery.js --config gallery.other.json`

Note: `./gallery.js` is a wrapper of `./cli.js` which offers more granular functionality
for file indexer, extractor, database builder or extractor. See `./cli.js -h` for details.

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
