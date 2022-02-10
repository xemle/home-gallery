const valueFilter = (ast, options) => {
  const needle = ast.value.toLowerCase();
  return v => {
    const text = options.textFn(v) || '';
    return text.indexOf(needle) >= 0;
  }
}

module.exports = {
  valueFilter
}