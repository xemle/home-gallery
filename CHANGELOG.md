# Changelog of HomeGallery

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add incremental import with database reload support
- Add run cli command to start the server or source import directly
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

### Fixed

- config: Fix example parameter `apiServer`
- server: Fix database cache middleware
- index: Fix incremental import with multiple indices

## [1.0.1] - 2020-05-20

Bugfix release

### Fixed

- webapp: Fix empty search query
- cli: Fix source directories with whitespaces

## [1.0.0] - 2020-05-15

Initial release of 1.0.0
