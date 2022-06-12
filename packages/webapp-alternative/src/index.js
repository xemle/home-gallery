import React from "react"
import { createRoot } from 'react-dom/client';
import App from "./App"

const container = document.getElementById('app');
const root = createRoot(container);

root.render(<App />);

// Some ES2020 just for transpiler testing
const x = { firstName: 'Pavel', lastName: 'Buramensky' }
const y = { ...x, position: 'Developer' }

console.log(`I am ${y?.firstName} ${y?.lastName}, my position is ${y?.position} and I am ${y?.age} years old`)
