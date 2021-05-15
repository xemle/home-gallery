![HomeGallery hero image](https://home-gallery.org/hero.png "self-hosted open-source web gallery")

# HomeGallery

[![Join the chat at https://gitter.im/home-gallery/community](https://badges.gitter.im/home-gallery/community.svg)](https://gitter.im/home-gallery/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[Home-Gallery.org](https://home-gallery.org) is a self-hosted open-source web gallery
to browse personal photos and videos featuring tagging, mobile-friendly, and AI
powered image and face discovery. Try the [demo gallery](https://demo.home-gallery.org)
or enjoy the [food images](https://demo.home-gallery.org/similar/c7f8a3bf0142fc9694f517c23e42d988c97233c3)!

Note: This software is a private pet/spare time project without any warranty or any
support. Ask questions on [gitter.im](https://gitter.im/home-gallery/community).

[MIT License](https://en.wikipedia.org/wiki/MIT_License)

## Motivation

* The source of all my private images and videos are stored local on my NAS at home
* Cloud service do not cover my privacy concerns
* All gallery software are lacking to have a fast user experience on mobile phones
* The gallery software should help to browse or discover forgotten memories from the image archive

## Target Users

* Computer/Terminal affine users who solve their own problems, familiar with shell
* Serve your local data without usage of cloud services
* One user only - all files are served
* View your own photos and videos from mobile phones
* Serve all your images from multiple source directories (hard drive, camara files, mobile phone files, etc)

## Documentation

See [docs.home-gallery.org](https://docs.home-gallery.org) for general documentation. The general
architecture is described [here](https://docs.home-gallery.org/internals/index.html).

## Features

- Reverse image lookup (similar image search). If you have one sunset image, you can easily find other sunset photos in your archive without manual tagging
- Face detection and search by similar faces
- GEO location reverse lookups
- Simple mobile app through [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) support
- Tagging, single and multi selection
- Support of read only and offline media sources. Once the preview files are generated and their meta data are extraced, the original sources are not touched and required any more. So media from offline disk need to be extracted only once and the disk can stay offline on next runs
- Media are identified by their content. Duplicated media (identical files byte-by-byte) are only processed once. Renaming is supported without recalulating previews etc.
- Fast file changes detection such as add, removes, renames or moves
- Static side export such as the [demo gallery](https://demo.home-gallery.org)

## Limits

The complete "database" is loaded into the browser. My 100.000 media are about
100 MB plain JSON and 12 MB compressed JSON. The performance is quite good on
current mobile device. A user reported a successful setup with over 400.000
media files. Further feedback is welcome.

## Binary Downloads

HomeGallery has prebuilt binaries for
[Linux](https://dl.home-gallery.org/dist/latest/home-gallery-latest-linux-x64),
[MacOS](https://dl.home-gallery.org/dist/latest/home-gallery-latest-darwin-x64) and
[Windows](https://dl.home-gallery.org/dist/latest/home-gallery-latest-win-x64.exe).
Further download options can be found [here](https://dl.home-gallery.org/dist).

The initial start of the binary takes longer due the extraction of app files to
a temporary directory. Future starts are faster.

If no `gallery.config.yml` file exists it is created by the example configuration.
See details below.

## Configure HomeGallery

Copy `gallery.config-example.yml` to `gallery.config.yml` and configure
`gallery.config.yml` with source media directories and other settings.

A bare minimal configuration is

```
sources:
  - dir: ~/Pictures
```

to include all images and videos from your `$HOME/Pictures` directory. The previews
are stored in `~/.cache/home-gallery` and the configuration files like
file index, database, events are stored in `~/.config/home-gallery` directory.

A more advance configuration with all gallery files in `/mnt/gallery` would be have

```
baseDir: /mnt/gallery
configDir: '{baseDir}/config'
cacheDir: '{baseDir}'
sources:
  - dir: /mnt/media
    index: '{configDir}/mnt-media.idx
    exclude:
      - *.CR2
      - *.cr2
  - dir: ~/Pictures
    index: '{configDir}/{basename(dir)}.idx'
server:
  port: 8080
  key: '{configDir}/server.key'
  cert: '{configDir}/server.crt'
```

to use media files from directories `/mnt/media` and `$HOME/Pictures`.
The storage directory is
`/mnt/gallery/storage` and other gallery configuration files are located at
`/mnt/gallery/config`. The server uses https on port 8080.

See [gallery.config-example.yml](gallery.config-example.yml) for more configuration details.
The gallery configuration can be also written in JSON format and must end with `.json` like
`gallery.config.json`.

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

## Customized Environments

HomeGallery runs on the JavaScript runtime [NodeJS](https://nodejs.org) which
is supported by various platforms such as Linux (also Raspberry PIs), Mac and Windows.

For most cases a customized environment should be sufficient with

* [node](https://nodejs.org) version 14 LTS
* perl (Linux)

### Setup

```
# Clone or download the repo from GitHub
git clone https://github.com/xemle/home-gallery.git
cd home-gallery
# Install required packages
npm install
# Build required modules
npm run build
```

In some cornor cases you might also need essential build tools to compile library
bindings.

* make
* g++
* python

### Run HomeGallery

Run `./gallery.js` (or `node gallery.js`) to

- update and process media files
- start the web server
- update the gallery application (requires git)

Use different configurations by `--config <file>` parameter. E.g. `./gallery.js --config other-gallery.config.yml`.

Note: `./gallery.js` is a wrapper of `./cli.js` which offers more granular functionality
for file indexer, extractor, database builder or extractor. See `./cli.js -h` for details.

## Docker

Instead of installing node and other required libraries you can use also docker to run the gallery

### Build

Build the docker image by following command

```
docker build -t home-gallery .
```

### Data volume structure

The gallery is located at `/app` whereas the data is stored in `/data` within the container.
The `/data` folder has following structure:

```
`-- ./data - Docker data volume
  +-- sources - Your media file sources or other volumne mounts
  +-- config - Configuration files
  | `-- gallery.config.yml - Main configuration file
  `-- storage - Preview images and meta data
```

Configure your `./data/config/gallery.config.yml` configuration to use media files from `./data/sources`

```
sources:
  - dir: '{baseDir}/sources'
```

Run the docker container

```
docker run -ti --rm -v $(pwd)/data:/data -u $(id -u):$(id -g) -p 3000:3000 home-gallery
```

and follow the CLI to render preview files and start the webserver

### Mount files and folders

Media files might be located at multiple folders and paritions.
These folders and partitions should be mounted as docker volumes into `/data/sources` directory.
As example for a media partition `/mnt/media` run

```
docker run -ti --rm -v $(pwd)/data:/data -v /mnt/media:/data/sources/media -u $(id -u):$(id -g) -p 3000:3000 home-gallery
```

with source configuration in `gallery.config.yml`:

```
sources:
  - dir: '{baseDir}/sources/media'
```

## Development

HomeGallery uses [lerna](https://github.com/lerna/lerna) with multi
packages. Common npm scripts are `clean`, `build`, `watch`.

To run only a subset of packages you can use lerna's
scope feature, e.g build only module `export` and `database`:

```
npm run build -- --scope '@home-gallery/{export,database}'
```
