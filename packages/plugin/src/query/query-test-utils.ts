import { TQueryContext, TQueryAst } from "@home-gallery/types"

export const createEntryMock = (id: string, data = {}) => {
  return {
    id,
    hash: 'abc.' + id,
    type: 'image',
    updated: '2024-08-01T11:44:53.734Z',
    date: '2024-08-01T11:44:53.734Z',
    files: [],
    previews: [],
    ...data,
  }
}

export const createQueryContext = (): TQueryContext => ({
  textFn: e => e.id,
  queryErrorHandler(ast: TQueryAst, context: TQueryContext, reason: string) {
    const err = new Error(`Failed to handle query ast: ${reason}`)
    Object.assign(err, { ast })
    throw err
  },
  plugin: {}
})