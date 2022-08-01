# Changelog of HomeGallery

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- webapp: Add timeline scrollbar
- webapp: Add optional remote console for debugging purposes

## [1.5.0] - 2022-07-15

### Added

- database: Honor date from meta sidecars
- webapp: Use shorten id in links against history attacks
- webapp: Improve database chunk size adjustment based on response times
- webapp: Improve caching with hashed asset filenames
- webapp: Add image and video amount to year list
- webapp: Improve UI by fetching data in separate web worker
- extractor: Improve low powered api server with timout and concurrent parameter

### Fixed

- webapp: Fix preview sizes in stream
- bin: Raise node version to v16.16.0 to general fix security issues
- webapp: Fix data mapping for initial state
- database: Speedup id grouping
- fetch: Fix query with polluted text cache
- export: Fix query with polluted text cache
- webapp: Fix relative resources from base URI
- webapp: Fix previews of smaller images
- docker: Fix docker-compose setup

## [1.4.1] - 2022-03-26

### Fixed

- docker: Fix arm image build

## [1.4.0] - 2022-03-26

This release adds tags from XMP sidecar files, enhances the media search
capabilities, adds support to use native commands like ffmpeg, extracts preview
files from RAW images and adds support to HEIC files (from iphones).

### Added

- docker: Support arm docker images
- bundle: Add all-generic bundle
- cli: Configuration for max memory value for database creation
- extractor: Create only smaller preview images than the source
- extractor: Option to use native system executables like vipsthumbnail or ffmpeg
- extractor: Add support for heic/heif image format
- extractor: Extract embedded previews from raw files
- query: Add cmp, (all) in list and range to common properties
- query: Allow capitalized keywords
- database: Add entry groups
- database: Add updated timestamp
- database: Support IPTC keywords as tags
- index: Improve journal for sidecar changes
- server: Add optional basic authentication of users and ip whitelists
- webapp: Add a tab to list tags (by biolds)
- extractor: Add option for geo address server
- extractor: Add error threshold for api calls
- cast: Add reverse option

### Changed

- Default node version is v16 (Gallium)
- extractor: Reduce log levels. Use debug log level for details
- cast: Set default order is by date oldest first

### Fixed

- cli: Fix update with source selection
- extractor: Fix resizing to squared boundary size
- query: Fix query expression with keyword prefix like india or andrea
- extractor: Except buggy Samsung images (by psdimon)
- query: Fix query expressions with parenthesis
- database: Unify city geo information from hamlet, village, town
- fetch: Improve error handling for events

## [1.3.0] - 2021-08-27

### Added

- Add cast cli for a Chromecast-enabled slide show
- server: Apply events on database load
- server: Allow query parameter for database api
- Add fetch command to fetch and merge a remote gallery

### Changed

- Use `/api/database.json` instead of `/api/database`
- Use `/api/events.json` instead of `/api/events`

### Fixed

- database: Handle incomplete geo data
- index: Fix graceful abort by user (ctrl-c)

## [1.2.2] - 2021-08-18

### Fixed

- Fix test execution on parallel streams
- Fix logger colors for terminals with color level 1 (16 colors)
- index: Fix error handling on checksum calculation

## [1.2.1] - 2021-08-08

### Fixed

- Fix cli logger call

## [1.2.0] - 2021-08-06

### Added

- Add option to open browser on server start
- Add logger with console and file logger
- Add quick search links on some media meta data
- Add keyboard shortcuts to single view
- Add end to end tests
- Add file index journal
- Speedup incemental database updates via file index journal

### Fixed

- export: Fix webapp copy for export
- index: Fix checksum option. Use `--no-checksum` to disable it

## [1.1.0] - 2021-06-22

This release improves the installation options, the initial usage
and adds valuable configuration options.
It offers official docker images `xemle/home-gallery` and `xemle/home-gallery-api-server`
and better local setup through docker-compose.

### Added

- Add initial `docker-compose.yml`
- Add incremental import with database reload support
- Add run cli command to init config, start the server or source import directly
- config: Add `matcher` for index file matcher
- config: Add `geoAddressLanguage` for geo code reverse lookup language
- extractor: Print video progress
- extractor: Add `--concurrency`, `--skip` and `--limit` parameter for issue identifications
- server: Wait for database file if not exist
- index: Add `--add-limits` parameter

### Changed

- cli: Extract and unify separate cli package
- index: Calculate file checksum by default. Use `--no-checksum` to disable it
- index: Changed sort order. Initial import imports latest dirs first
- docker: Use docker builder and app bundle
- database: Add atomic write for database

### Fixed

- config: Fix example parameter `apiServer`
- server: Fix database cache middleware
- index: Fix incremental import with multiple indices

## [1.0.1] - 2021-05-20

Bugfix release

### Fixed

- webapp: Fix empty search query
- cli: Fix source directories with whitespaces

## [1.0.0] - 2021-05-15

Initial release of 1.0.0
