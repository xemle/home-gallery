# Example

Setup media catalog 

```
export MEDIA_DIR=$HOME/Pictures
export INDEX=./data/home-pictures.idx
export STORAGE=./data/storage
export CATALOG=$STORAGE/catalog.db
```

Build index, preview and catalog

```
DEBUG=* node index.js -i $INDEX -d $MEDIA_DIR -c
DEBUG=* node exif.js -i $INDEX -s $STORAGE
DEBUG=* node preview.js -i $INDEX -s $STORAGE
DEBUG=* node video.js -i $INDEX -s $STORAGE
DEBUG=* node catalog-extractor.js -i $INDEX -s $STORAGE -o $CATALOG
```

Start server

DEBUG=* node server.js -s $STORAGE -c $CATALOG -p 3000
