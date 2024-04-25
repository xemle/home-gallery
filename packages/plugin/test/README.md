# Plugin Test directory

This directory contains test plugins

## ESM or CommonJS?

Per default `*.js` files are imported as ESM. `*.mjs` are loaded
explicit as ESM. `*.cjs` are loaded explicit as CommonJS.

If `package.json` is provided, type property `module` indicates ESM
format while missing type property or `commonjs` indicates CommonJS
format. 