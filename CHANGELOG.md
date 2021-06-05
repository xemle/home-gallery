# Changelog of HomeGallery

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- config: Add `matcher` for index file matcher
- config: Add `geoAddressLanguage` for geo code reverse lookup language
- extractor: Print video progress
- extractor: Add `--concurrency`, `--skip` and `--limit` parameter for issue identifications
- index: Add `--add-limits` parameter

### Changed

- index: Calculate file checksum by default. Use `--no-checksum` to disable it

### Fixed

- config: Fix example parameter `apiServer`

## [1.0.1] - 2020-05-20

Bugfix release

### Fixed

- webapp: Fix empty search query
- cli: Fix source directories with whitespaces

## [1.0.0] - 2020-05-15

Initial release of 1.0.0