const ERROR_PAYLOAD_TO_LARGE = 413;

export const binaryBodyMiddleware = (maxBytes) => {
  return (req, res, next) => {
    const chunks = [];
    let totalChunkBytes = 0;
    req
      .on('data', chunk => {
        chunks.push(chunk);
        totalChunkBytes += chunk.length;
        if (totalChunkBytes > maxBytes) {
          const err = new Error(`Content limit of max ${maxBytes} bytes exceeded`);
          console.log(err.message);
          res.status(ERROR_PAYLOAD_TO_LARGE).json({error: err.message});
          req.destroy();
        }
      })
      .on('end', () => {
        const body = Buffer.concat(chunks);
        req.body = body;
        console.log(`Read binary body with ${body.length} bytes`);
        next();
      })
      .on('error', (e) => {
        console.log(`Request error: ${e}`);
        res.status(400).json({error: e});
      })
  }
}
