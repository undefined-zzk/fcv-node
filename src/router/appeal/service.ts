import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { sendError, sendSuccess, sendFail, handlePage } from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'
import type { Page } from '../../types/index'
import { AppealDto, AppealAdviceDto, UpdateAdviceDto } from './dto'

export class AppealService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async AppealListService(req: Request, res: Response) {
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
    const orderBy = [{ sort }, { create_time: sort }]
    const total = await this.prismaDB.prisma.appeal.count()
    if (all > 0) {
      result = await this.prismaDB.prisma.appeal.findMany({
        orderBy,
        where,
        distinct: ['name'],
      })
    } else {
      result = await this.prismaDB.prisma.appeal.findMany({
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

  public async addAppealService(req: Request, res: Response) {
    const appealDto = plainToClass(AppealDto, req.body)
    const errors = await validate(appealDto)
    if (errors.length > 0) {
      return sendError(res, errors)
    }
    const { id, ...rest } = appealDto
    if (isNumber(id)) {
      const exits = await this.prismaDB.prisma.appeal.findUnique({
        where: { id: +id },
      })
      if (!exits) return sendFail(res, 400, '数据不存在id错误')
      if (rest.name !== exits.name) {
        const exits = await this.prismaDB.prisma.appeal.findFirst({
          where: { name: rest.name },
        })
        if (exits) return sendFail(res, 400, '名称已存在')
      }
      const result = await this.prismaDB.prisma.appeal.update({
        where: { id: id },
        data: rest,
      })
      return sendSuccess(res, result)
    } else {
      const exits = await this.prismaDB.prisma.appeal.findFirst({
        where: { name: rest.name },
      })
      if (exits) return sendFail(res, 400, '名称已存在')
      const result = await this.prismaDB.prisma.appeal.create({
        data: rest,
      })
      return sendSuccess(res, result)
    }
  }

  public async deleteAppealService(req: Request, res: Response) {
    const ids = req.query.ids
    if (!ids) return sendFail(res, 400, '缺少query参数ids')
    const id = (ids as string).split(',').map((id) => +id)
    if (!id.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    const existIds = await this.prismaDB.prisma.appeal.findMany({
      where: { id: { in: id } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    if (delIds.length === 0) return sendFail(res, 400, 'id都不存在')
    try {
      await this.prismaDB.prisma.appeal.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds.length}条数据${delIds}`)
  }

  public async reportAppealService(req: Request, res: Response) {
    const appealAdviceDto = plainToClass(AppealAdviceDto, req.body)
    const errors = await validate(appealAdviceDto)
    if (errors.length > 0) {
      return sendError(res, errors)
    }
    const { id, appeals, ...rest } = appealAdviceDto
    const result = await this.prismaDB.prisma.appealRecord.create({
      data: {
        ...rest,
        appeal: {
          connect: appeals.map((id) => ({ id: +id })),
        },
      },
    })
    return sendSuccess(res, result)
  }

  public async updateReportAppealService(req: Request, res: Response) {
    const updateAdviceDto = plainToClass(UpdateAdviceDto, req.body)
    const errors = await validate(updateAdviceDto)
    if (errors.length > 0) {
      return sendError(res, errors)
    }
    const { ids, ...rest } = updateAdviceDto
    if (!ids.every((id) => Number.isInteger(+id) && id > 0)) {
      return sendFail(res, 400, 'ids内数据格式错误')
    }
    const existIds = await this.prismaDB.prisma.appealRecord.findMany({
      where: { id: { in: ids.map((id) => +id) } },
      select: { id: true },
    })
    const updateIds = existIds.map((item) => item.id)
    if (updateIds.length === 0) return sendFail(res, 400, 'id都不存在')
    const result = await this.prismaDB.prisma.appealRecord.updateMany({
      where: { id: { in: updateIds } },
      data: rest,
    })
    return sendSuccess(res, result)
  }
  public async getReportAppealService(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all, type } =
      handlePage(query)
    let result = []
    const where = {
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
      type: +type || undefined,
    }
    const orderBy = [{ create_time: sort }]
    const total = await this.prismaDB.prisma.appealRecord.count()
    if (all > 0) {
      result = await this.prismaDB.prisma.appealRecord.findMany({
        orderBy,
        where,
      })
    } else {
      result = await this.prismaDB.prisma.appealRecord.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          appeal: { select: { name: true, id: true } },
        },
        where,
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
