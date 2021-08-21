const sendError = (res, code, message) => {
  return res.status(code).json({
    error: {
      code,
      message
    }
  })
}

module.exports = {
  sendError
}