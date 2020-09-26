# Example Scripts

This folder contains bash scripts to simplify CLI calls.

By default it will create a gallery from $HOME/Pictures folder. You can change the folders in the `config` file

## Files

* config: Sets common environment variables
* excludes: Exclude pattern examples

## Scripts

* init.sh: Bootstraps source dependecies and builds cli from sources
* update-gallery.sh: Updates gallery files from a source directory
* start-server.sh: Starts the HomeGallery web server
* run-all.sh: runs init.sh, update-gallery.sh and start-server.sh for quick start