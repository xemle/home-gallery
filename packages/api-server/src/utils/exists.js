import fs from 'fs/promises';

export const exists = async file => fs.access(file).then(() => true, () => false);
