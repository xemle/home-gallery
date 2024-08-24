import * as Yup from 'yup'

const requiredFunction = Yup.mixed().test({name: 'isAFunction', message: '${path} must be a function', test: value => typeof value == 'function'}).required()
const optionalFunction = Yup.mixed().test({name: 'isAFunction', message: '${path} must be a function', test: value => typeof value == 'function' || typeof value == 'undefined'}).optional()

export const PluginSchema = Yup.object({
  'name': Yup.string().required(),
  'version': Yup.string().required(),
  'requires': Yup.array().optional(),
  'environments': Yup.array().of(Yup.string().oneOf(['server', 'browser'])).optional(),
  'initialize': requiredFunction,
})

export const ExtractorSchema = Yup.object({
  'name': Yup.string().required(),
  'phase': Yup.string().optional().oneOf(['meta', 'raw', 'file']).default('file'),
  'create': requiredFunction,
  'tearDown': optionalFunction
})

export const DatabaseSchema = Yup.object({
  'name': Yup.string().required(),
  'order': Yup.number().optional().default(1),
  'mapEntry': requiredFunction
})

export const QuerySchema = Yup.object({
  'name': Yup.string().required(),
  'order': Yup.number().optional().default(1),
  'textFn': optionalFunction,
  'transformRules': Yup.array().optional(),
  'queryHandler': optionalFunction
}).test({ name: 'hasOne', test: query => !!(query.textFn || query.transformRules?.length || query.queryHandler), message: 'At lease on property must be set' })

export const extensionSchemas = {
  'extractor': ExtractorSchema,
  'database': DatabaseSchema,
  'query': QuerySchema,
}
