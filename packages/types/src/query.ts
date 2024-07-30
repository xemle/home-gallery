export type TQueryAstTypes = 'query'

export type TOrderAstType = 'orderBy' | 'orderKey' | 'orderFn'

export type TSingleAstType = 'not' | 'paren' | 'keyValue' | 'cmp'

export type TListAstType = 'or' | 'and' | 'cmp' | 'terms' | 'inList' | 'inRange' | 'allIn' | 'list'

export type TTextAstType = 'comboundValue' | 'range' | 'text' | 'identifier'

export type TFunctionAstType = 'cmpFn' | 'existsFn' | 'countFn'

export type TAstType = TQueryAstTypes | TOrderAstType | TSingleAstType | TListAstType | TTextAstType | TFunctionAstType | 'noop'

export type TAstOp = '<=' | '>=' | '!=' | '>' | '<' | '=' | '~' | ':'

export type TAst = {
  type: TAstType
  // column of original query position
  col: number

  value?: TAst | TAst[] | string

  fn?: string
  key?: string
  op?: TAstOp

  mapper?: (e: any) => any // type query. Optional rewrite entries after filter and before sort. By default it is the identity function
  orderBy?: TAst // type query if order is given

  direction?: boolean | 'asc' | 'desc' // type orderBy
}

export type TQueryAst = TAst & {
  // filter function to exclude entries
  filter?: (e: any) => boolean
  cost?: number

  // sort function has precedence over scoreFn and direction
  sort?: (filteredEntries: any[], allEntries: any[]) => any[]
  scoreFn?: (entry: any) => any // used with direction property

  // custom data for traversal results
  data?: any
}

/**
 * Transform the query ast from top to down traversal
 */
export type TAstTransformer = (ast: TAst, context: TQueryContext) => TAst

/**
 * @returns Returns error state. Return true if error is handled. On false further handlers are called in the handle chain
 */
export type TQueryAstErrorHandler = (ast: TQueryAst, context: TQueryContext, reason: string) => boolean

export type TQueryContext = {
  /**
   * Text function to find simple text terms
   */
  textFn: (entry: any) => string
  /**
   * Handler for unknown query mappings. Eg. unknown key for comparison function
   */
  queryErrorHandler: TQueryAstErrorHandler
  /**
   * Any context information for plugins in schema of plugin.[name].[prop]
   */
  plugin: {
    [key: string]: any
  }

  /**
   * Original AST of query term. Set after query execution for logging or debugging purposes
   */
  ast?: TAst
  /**
   * Transformed AST for query. Set after query execution for logging or debugging purposes
   */
  queryAst?: TAst
  /**
   * Stringified AST for query. Set after query execution for logging or debugging purposes
   */
  stringifiedQueryAst?: string
  /**
   * Filter function for entries. Set after query execution
   */
  queryFilter?: (e: any) => boolean
  /**
   * Map entry after filter and before sort. This can be defined on AST type query or orderedQuery. Set after query execution
   */
  queryMapper?: (e: any) => any
  /**
   * Sort function for entries. Set after query execution for debugging purposes
   */
  querySort?: (entries: any[], allEntries: []) => any[]
}

export type TQueryTextFn = (entry: any) => string

export type TAstTransformRule = {
  types?: TAstType[]
  keys?: string[]
  ops?: string[]
  matchValue?: (value: string) => boolean
  description?: string
  transform: TAstTransformer
}

/**
 * Create a filter and sort function from bottom to up traversal
 *
 * If ast node can not be matched, call context.queryErrorHandler(ast, context) to chain plugins
 */
export type TQueryAstHandler = (ast: TQueryAst, context: TQueryContext) => TQueryAst

export type TQueryPlugin = {
  name: string
  order?: number
  /**
   * Text function to find simple text terms in plugins data
   */
  textFn?: TQueryTextFn
  /**
   * Transform rules to update the query. A transform rule
   * changes or creates new ast nodes.
   *
   * They are executed in order from top to down.
   */
  transformRules?: TAstTransformRule[]
  /**
   * Handle new filter and sort functionality via
   * the query error handler. The error handler is called
   * when a filter or sort function can not be created
   * on an ast node
   */
  queryHandler?: TQueryAstErrorHandler
}

/**
 * The query executor parses the query and builds a query AST (abstract syntax tree).
 * Plugins can hook into different AST operations and can transform the AST.
 *
 * Following steps are executed
 *
 * - filter: Filter entries by query AST
 * - map: Map filtered entries
 * - sort: Sort entries by orderBy AST
 *
 * The result is a entry list, which matches the AST condition and is ordered
 * by the order definition. Entries might be modified by the entry mapper
 */
export type TQueryExecutor = (entries: any[], query: string, context: TQueryContext) => Promise<any[]>
