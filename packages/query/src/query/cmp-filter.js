const { dateKeys } = require('./keys')
const { toLower, matchNumber, matchFloat, matchDate, getDateByKey, dirname, basename, ext } = require('./utils')

const cmpFilters = [
  {
    keys: ['id', 'model', 'make', 'country', 'state', 'city', 'road'],
    ops: ['=', '!=', '~'],
    filter: ast => compare(v => toLower(v[ast.key]), ast.op, toLower(ast.value.value))
  },
  {
    keys: ['type'],
    ops: ['=', '!='],
    matchValue: v => v.match(/^(image|rawImage|video)$/),
    filter: ast => compare(v => v[ast.key], ast.op, ast.value.value)
  },
  {
    keys: ['index'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.files, ast.op, ast.value.value, v => v.index)
  },
  {
    keys: ['file'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.files, ast.op, ast.value.value, v => v.filename)
  },
  {
    keys: ['path'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.files, ast.op, ast.value.value, v => dirname(v.filename))
  },
  {
    keys: ['filename'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.files, ast.op, ast.value.value, v => basename(v.filename))
  },
  {
    keys: ['ext'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.files, ast.op, toLower(ast.value.value), v => toLower(ext(v.filename)))
  },
  {
    keys: ['filesize'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: v => v.match(bytes.pattern),
    filter: ast => listCompare(v => v.files, ast.op, bytes.parse(ast.value.value), v => +v.size)
  },
  {
    keys: dateKeys,
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchNumber,
    filter: ast => compare(v => getDateByKey(v.date, ast.key), ast.op, +ast.value.value)
  },
  {
    keys: ['date'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchDate,
    filter: ast => compare(v => v.date.substring(0, 10), ast.op, ast.value.value)
  },
  {
    keys: ['width', 'height', 'iso'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchNumber,
    filter: ast => compare(v => v[ast.key], ast.op, +ast.value.value)
  },
  {
    keys: ['ratio'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: v => v.match(ratio.pattern),
    filter: ast => and(v => v.width > 0 && v.height > 0, compare(v => v.width / v.height, ast.op, ratio.parse(ast.value.value)))
  },
  {
    keys: ['duration'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: v => v.match(duration.pattern),
    filter: ast => compare(v => v.duration, ast.op, duration.parse(ast.value.value))
  },
  {
    keys: ['latitude', 'longitude'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchFloat,
    filter: ast => compare(v => v[ast.key], ast.op, +ast.value.value)
  },
  {
    keys: ['tag'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.tags, ast.op, toLower(ast.value.value))
  },
  {
    keys: ['object'],
    ops: ['=', '!=', '~'],
    filter: ast => listCompare(v => v.objects, ast.op, toLower(ast.value.value), o => toLower(o.class))
  },
]

const cmpFilter = (ast, options) => {
  const filter = cmpFilters.find(filter => matchCmpFilter(filter, ast))
  if (filter) {
    return filter.filter(ast, options)
  }
  return options.unknownExpressionHandler(ast, options)
}

const matchCmpFilter = (cmp, ast) => (!cmp.keys || cmp.keys.includes(ast.key)) &&
  (!cmp.ops || cmp.ops.includes(ast.op)) &&
  (!cmp.matchValue || cmp.matchValue(ast.value.value))

const compare = (valueFn, op, right) => v => {
  const value = valueFn(v)
  if (op == '=') {
    return value == right
  } else if (op == '>') {
    return value > right
  } else if (op == '>=') {
    return value >= right
  } else if (op == '<') {
    return value < right
  } else if (op == '<=') {
    return value <= right
  } else if (op == '!=') {
    return value != right
  } else if (op == '~') {
    return value?.includes(right)
  } else {
    return false
  }
}

const listCompare = (valuesFn, op, right, valueMapFn = v => toLower(v)) => {
  return v => {
    const values = valuesFn(v)
    if (!values) {
      return op == '!='
    } else if (op == '=') {
      return values.find(value => valueMapFn(value) == right)
    } else if (op == '<') {
      return values.find(value => valueMapFn(value) < right)
    } else if (op == '<=') {
      return values.find(value => valueMapFn(value) <= right)
    } else if (op == '>') {
      return values.find(value => valueMapFn(value) > right)
    } else if (op == '>=') {
      return values.find(value => valueMapFn(value) >= right)
    } else if (op == '!=') {
      return !values.find(value => valueMapFn(value) == right)
    } else if (op == '~') {
      return values.find(value => toLower(valueMapFn(value)).includes(toLower(right)))
    } else {
      return false
    }
  }
}


const and = (fn1, fn2) => v => fn1(v) && fn2(v)

const duration = {
  // format support for seconds or MM:SS or HH:MM:SS
  pattern: /^((\d+)|(((\d{1,2}:)?\d{1,2}:)?\d{1,2}))$/,
  parse: function(value) {
    const m = value.match(this.pattern)
    if (m[2]) {
      return +m[2]
    } else {
      return m[3].split(':')
        .map(v => +v)
        .reduce((r, v) => r * 60 + v)
    }
  }
}

const ratio = {
  pattern: /^((\d+(\.\d+)?)|(([1-9][0-9]*)\/([1-9][0-9]*)))$/,
  parse: function(value) {
    const m = value.match(this.pattern)
    if (m[2]) {
      return +m[2]
    } else {
      return +m[5] / +m[6]
    }
  }
}

const bytes = {
  pattern: /^(\d+)(([kKmMgGtT])[bB]?)?$/,
  parse: function(value) {
    const m = value.match(this.pattern)
    const units = {
      k: 1 << 10,
      m: 1 << 20,
      g: 1 << 30,
      t: (1 << 30) * 1024
    }
    const factor = m[3] ? units[m[3].toLowerCase()] : 1
    return +m[1] * factor
  }
}

module.exports = {
  matchCmpFilter,
  compare,
  listCompare,
  cmpFilter
}
