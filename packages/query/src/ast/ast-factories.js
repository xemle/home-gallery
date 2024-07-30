export const orAst = (values, col = 0) => ({ type: 'or', value: values, col })

export const andAst = (values, col = 0) => ({ type: 'and', value: values, col })

export const cmpAst = (key, op, value, col = 0) => ({ type: 'cmp', key, op, value, col })

export const valueAst = (value, col = 0) => ({ type: 'value', value, col })
