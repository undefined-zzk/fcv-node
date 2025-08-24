import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { sendError, sendSuccess, sendFail, handlePage } from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'
import type { Page } from '../../types/index'
import {} from './dto'

export class FrameFuncService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async frameFuncService(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all } =
      handlePage(query)
    let result = []
    const where = {
      name: { contains: query.title || '' },
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
    }
    const orderBy = [{ hot: sort }, { create_time: sort }]
    const total = await this.prismaDB.prisma.tag.count({
      where: {
        status: 0,
      },
    })
    if (all > 0) {
      result = await this.prismaDB.prisma.tag.findMany({
        orderBy,
        where,
        distinct: ['name'],
      })
    } else {
      result = await this.prismaDB.prisma.tag.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
        distinct: ['name'],
        orderBy,
      })
    }
    return sendSuccess(res, {
      list: result,
      pageNum,
      pageSize,
      total,
    })
  }
}
