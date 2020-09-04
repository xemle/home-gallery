const config = ['__home-gallery'].reduce((obj, path) => {
  if (!obj[path]) {
    obj[path] = {};
  }
  return obj[path];
}, window || {});

export const baseResolver = () => {
  const base = config.base || ''
  return base.replace(/\/$/, '');
};