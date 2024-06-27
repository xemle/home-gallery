import { run } from './src/index.js'

run().then(() => console.log(`Server is up and running`), e => console.log(`Error: ${e}`, e));
