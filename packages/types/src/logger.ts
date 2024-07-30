export type TTimeLoggerFn = (date: Date, message: string) => void
export type TObjectLoggerFn = (obj: any, message: string) => void
export type TDefaultLoggerFn = (message: string) => void
export type TLoggerFn = TTimeLoggerFn & TObjectLoggerFn & TDefaultLoggerFn

export type TLoggerFactoryStaticAddPretty = (level: string) => void
export type TLoggerFactoryStaticAddFile = (file: string, level: string, cb: () => void) => void
export type TLoggerFactoryStatic = TLoggerFactoryStaticAddPretty | TLoggerFactoryStaticAddFile
export type TLoggerFactoryCreate = (module: string) => TLogger

export type TLoggerFactory = TLoggerFactoryStatic & TLoggerFactoryCreate

export type TLogger = {
  error: TLoggerFn
  warn: TLoggerFn
  info: TLoggerFn
  debug: TLoggerFn
  trace: TLoggerFn
}
