# Example Scripts

This folder contains example bash scripts to simplify CLI calls.

By default it will create a gallery from `$HOME/Pictures` folder.

The storage directory is `$HOME/.cache/home-gallery/storage` and the index,
database and events files are stored in `$HOME/.config/home-gallery`.

You can change these settings in the `config` file

## Files

* `config`: Sets common environment variables
* `excludes`: Exclude pattern examples
* `excludes-only-images`: Exclude pattern example for only JPGs and PNGs

## Scripts

* `init.sh`: Bootstraps source dependecies and builds cli from sources
* `update-gallery.sh`: Updates gallery files from a source directory. Use
  `--full` option for full update. Otherwise it is a partial update
* `start-server.sh`: Starts the HomeGallery web server
* `run-all.sh`: runs `init.sh`, `update-gallery.sh` and `start-server.sh` for
  a quick start
