const run = require('./src');

run().then(() => console.log(`Server is ready and running`), e => console.log(`Error: ${e}`));
