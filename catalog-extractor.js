const extract = require('./lib/catalog/index');

const args = process.argv.slice(2);

const options = {
  indexFilename: 'fs.idx',
  storageDir: '.',
  catalogFilename: 'catalog.db'
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-i') {
    options.indexFilename = args.shift();
  } else if (arg === '-s') {
    options.storageDir = args.shift();
  } else if (arg === '-d') {
    options.catalogFilename = args.shift();
  }
}

const t0 = Date.now();
extract(options.indexFilename, options.storageDir, options.catalogFilename, (err) => {
  if (err) {
    console.log(`Could not create catalog: ${err}`);
  } else {
    console.log(`Catalog extracted in ${Date.now() - t0}.ms`);
  }

})
