import { through } from './through.js';

export const purge = () => through((entry, _, cb) => cb())
