import log4js from 'log4js'
import { NextFunction, Request, Response } from 'express'
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'logs/app.log' },
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'debug' },
  },
})

const logger = log4js.getLogger('default')
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.debug(
    `${req.method} ${req.url} - ${JSON.stringify(req.body)}-${JSON.stringify(
      req.query
    )}-${JSON.stringify(req.params)}-${req.headers.host}`
  )
  next()
}

export default loggerMiddleware
