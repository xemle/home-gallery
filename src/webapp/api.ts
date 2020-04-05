export const fetchAll = (chunkLimits, onChunk) => {
  let chunkIndex = 0;

  const next = async () => {
    let url = './api';
    let limit = 0;
    if (chunkIndex < chunkLimits.length) {
      const offset = chunkIndex > 0 ? chunkLimits[chunkIndex - 1] : 0;
      limit = chunkLimits[chunkIndex++] - offset;
      url += `?offset=${offset}&limit=${limit}`;
    } else if (chunkLimits.length) {
      const offset = chunkLimits[chunkLimits.length - 1];
      url += `?offset=${offset}`;
    }
    return await fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.media || !data.media.length) {
          return;
        }
        onChunk(data.media);
        if (limit && data.media.length == limit) {
          return next();
        }
      });
  }

  next();
}

