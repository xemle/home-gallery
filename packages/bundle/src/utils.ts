export const isArray = (a: any) => Array.isArray(a)

export const isString = (a: any) => typeof a === 'string'

export const isObject = (a: any) => typeof a === 'object' && !isArray(a)

export const toList = (a: any): any[] => isArray(a) ? a : (a ? [a] : [])

export const uniq = (v: any, i: number, a: any[]) => a.indexOf(v) == i

export const ignoreBaseDir = (dir: string) => dir.length && dir != '.'
