const defaultOptions = {
  textFn: v => JSON.stringify(v).toLowerCase(),
  unknownExpressionHandler: expression => {
    throw new Error(`Unknown expression ${expression.type} at ${expression.col}`)
  }
}

const createFilter = (ast, options, cb) => {
  const mergedOptions = {...defaultOptions, ...options};

  try {
    const filterFn = queryExpression(ast, mergedOptions);
    cb(null, filterFn);
  } catch (err) {
    cb(err);
  }
}

const queryExpression = (exp, options) => {
  if (exp.type == 'query') {
    return termsExpression(exp.value, options)
  } else {
    return termsExpression(exp, options)
  }
}

const termsExpression = (exp, options) => {
  if (exp.type == 'terms') {
    const filterFns = exp.value.map(e => orExpression(e, options))

    return v => !filterFns.find(filterFn => !filterFn(v))
  } else {
    return orExpression(exp, options)
  }
}

const orExpression = (exp, options) => {
  if (exp.type === 'or') {
    const left = orExpression(exp.left, options);
    const right = orExpression(exp.right, options);
    return v => left(v) || right(v)
  } else {
    return andExpression(exp, options);
  }
}

const andExpression = (exp, options) => {
  if (exp.type === 'and') {
    const left = andExpression(exp.left, options);
    const right = andExpression(exp.right, options);
    return v => left(v) && right(v);
  } else {
    return notExpression(exp, options);
  }
}

const notExpression = (exp, options) => {
  if (exp.type === 'not') {
    const notFn = notExpression(exp.value, options)
    return v => !notFn(v)
  } else {
    return expression(exp, options);
  }
}

const expression = (exp, options) => {
  if (exp.type === 'paren') {
    return termsExpression(exp.value, options);
  } else {
    return valueExpression(exp, options);
  }
}

const valueExpression = (exp, options) => {
  if (exp.type === 'value' || exp.type === 'text') {
    const needle = exp.value.toLowerCase();
    return v => {
      const text = options.textFn(v) || '';
      return text.indexOf(needle) >= 0;
    }
  } else {
    return options.unknownExpressionHandler(exp, options);
  }
}

module.exports = {
  createFilter
};