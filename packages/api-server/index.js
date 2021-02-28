const run = require('./src');

run().then(() => console.log(`Server is up and running`), e => console.log(`Error: ${e}`));
