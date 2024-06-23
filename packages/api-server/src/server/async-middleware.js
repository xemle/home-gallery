export const asyncMiddleware = fn => (req, res) => fn(req, res)
    .then(body => res.status(200).json(body))
    .catch(e => {
      console.log(`Error: ${e}`);
      res.status(500).json(e);
    })

