
const defaultOptions = {
  textFn: v => JSON.stringify(v).toLowerCase()
}

const createFilter = (ast, options, cb) => {
  const mergedOptions = Object.assign({}, defaultOptions, options);

  if (ast.type != 'query') {
    return cb(new Error('Invalid AST type. Expect type query'));
  }
  
  const filterFn = queryExpression(ast.value, mergedOptions);
  const queryFn = (list) => {
    const result = Array.isArray(list) ? list.filter(filterFn) : [list].filter(filterFn);
    return result;
  }
  cb(null, queryFn);
}

const queryExpression = (exp, options) => {
  if (exp.type === 'terms') {
    return termsExpression(exp.value, options);
  } else {
    return cb(new Error('Invalid AST type. Expect type terms'));
  }
}

const termsExpression = (exps, options) => {
  const filterFns = exps.map(exp => orExpression(exp, options))
  
  let filter = v => true;
  while (filterFns.length) {
    const headFns = filterFns.splice(0, Math.min(filterFns.length, 4));
    
    let filterFn;
    if (headFns.length === 4) {
      filterFn = v => headFns[0](v) && headFns[1](v) && headFns[2](v) && headFns[3](v);
    } else if (headFns.length === 3) {
      filterFn = v => headFns[0](v) && headFns[1](v) && headFns[2](v);
    } else if (headFns.length === 2) {
      filterFn = v => headFns[0](v) && headFns[1](v);
    } else {
      filterFn = headFns[0];
    }
    
    if (filter) {
      const prevFilter = filter;
      filter = v => prevFilter(v) && filterFn(v);
    } else {
      filter = filterFn;
    }
  }
  return filter;
}

const orExpression = (exp, options) => {
  if (exp.type === 'or') {
    const left = andExpression(exp.left, options);
    const right = orExpression(exp.right, options);
    return v => left(v) || right(v)
  } else {
    return andExpression(exp, options);
  }
}

const andExpression = (exp, options) => {
  if (exp.type === 'and') {
    const left = notExpression(exp.left, options);
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
  if (exp.type === 'value') {
    const needle = exp.value.toLowerCase();
    return v => {
      const text = options.textFn(v) || '';
      return text.indexOf(needle) >= 0;
    }
  } else if (exp.type === 'terms') {
    return termsExpression(exp.value, options);
  } else {
    throw new Error(`Unsupported exp type ${exp.type}`);
  }
}

module.exports = {
  createFilter
};