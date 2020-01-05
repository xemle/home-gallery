# Example

Setup Cloud Galery

```
export PICTURES_DIR=$HOME/Pictures
export PICTURES_INDEX=./data/home-pictures.idx
export STORAGE_DIR=./data/storage
export DATABASE=./data/catalog.db
```

index, extract, build and serve the Cloud Gallery

```
npm install
DEBUG=* node index.js index -i $PICTURES_INDEX -d $PICTURES_DIR -c
DEBUG=* node index.js extract -i $PICTURES_INDEX -s $STORAGE_DIR
DEBUG=* node index.js build -i $PICTURES_INDEX -s $STORAGE_DIR -d $DATABASE
DEBUG=* node index.js serve -s $STORAGE -d $DATABASE
```

# Development

## WebApp

```
API_PROXY=http://localhost:3000 npm run dev
```

```
API_PROXY=http://api.host:3000 npm run dev
```
