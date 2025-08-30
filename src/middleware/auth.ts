import { isAdmin, sendFail } from '../utils/index'
import type { Request, Response, NextFunction } from 'express'
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as any
  if (!isAdmin(user.role)) {
    return sendFail(res, 403, '权限不足')
  }
  next()
}
