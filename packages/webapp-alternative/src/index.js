console.log('Hello, world!')

const x = { firstName: 'Pavel', lastName: 'Buramensky' }
const y = { ...x, position: 'Developer' }

console.log(`I am ${y?.firstName} ${y?.lastName}, my position is ${y?.position} and I am ${y?.age} years old`)
