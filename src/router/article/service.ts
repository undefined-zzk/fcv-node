import { PrismaDB } from '../../db/psimadb/index'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { sendError, sendSuccess, sendFail } from '../../utils/index'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
export class ArticleService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async publishArticle(req: Request, res: Response) {
    return sendSuccess(res, '发布成功')
  }
}
