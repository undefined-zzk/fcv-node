import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { sendError, sendSuccess, sendFail, handlePage } from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'
import type { Page } from '../../types/index'
import { AddFuncClassifyDto } from './dto'

export class FuncClassifyService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async frameFuncService(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, startTime, endTime, all } = handlePage(query)
    let result = []
    const where = {
      name: { contains: query.title || '' },
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
    }
    const total = await this.prismaDB.prisma.frameClassify.count()
    if (all > 0) {
      result = await this.prismaDB.prisma.frameClassify.findMany({
        where,
        distinct: ['name'],
      })
    } else {
      result = await this.prismaDB.prisma.frameClassify.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
        distinct: ['name'],
      })
    }
    return sendSuccess(res, {
      list: result,
      pageNum,
      pageSize,
      total,
    })
  }
  public async addFrameFunc(req: Request, res: Response) {
    const addFrameFuncDto = plainToClass(AddFuncClassifyDto, req.body)
    const errors = await validate(addFrameFuncDto)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.frameClassify.findFirst({
      where: {
        name: addFrameFuncDto.name,
      },
      distinct: ['name'],
    })
    if (exits) {
      return sendFail(res, 400, '名称已存在')
    }
    const { id, ...rest } = addFrameFuncDto
    const result = await this.prismaDB.prisma.frameClassify.create({
      data: rest,
    })
    return sendSuccess(res, result)
  }
  public async updateFrameFunc(req: Request, res: Response) {
    const addFrameFuncDto = plainToClass(AddFuncClassifyDto, req.body)
    const errors = await validate(addFrameFuncDto)
    if (errors.length > 0) return sendError(res, errors)
    if (!addFrameFuncDto.id) return sendFail(res, 400, 'id不能为空')

    const exitId = await this.prismaDB.prisma.frameClassify.findUnique({
      where: { id: +addFrameFuncDto.id },
    })
    if (!exitId) return sendFail(res, 400, 'id不存在')
    const exits = await this.prismaDB.prisma.frameClassify.findFirst({
      where: {
        name: addFrameFuncDto.name,
      },
      distinct: ['name'],
    })
    if (
      exits &&
      addFrameFuncDto.status &&
      exits.status == addFrameFuncDto.status
    ) {
      return sendFail(res, 400, '名称已存在')
    }
    const { id, ...rest } = addFrameFuncDto
    const result = await this.prismaDB.prisma.frameClassify.update({
      where: {
        id: +addFrameFuncDto.id!,
      },
      data: rest,
    })
    return sendSuccess(res, result)
  }

  public async deleteFrameFunc(req: Request, res: Response) {
    const ids = req.query.ids
    if (!ids) return sendFail(res, 400, '缺少帖子query参数ids')
    const id = (ids as string).split(',').map((id) => +id)
    if (!id.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    const existIds = await this.prismaDB.prisma.frameClassify.findMany({
      where: { id: { in: id } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    if (delIds.length === 0) return sendFail(res, 400, 'id都不存在')
    const hasRelation = await this.prismaDB.prisma.frameFunc.findFirst({
      where: {
        classify_id: {
          in: delIds,
        },
      },
    })
    if (hasRelation) return sendFail(res, 400, '该分类下有关联数据')
    try {
      await this.prismaDB.prisma.frameClassify.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds.length}条数据${delIds}`)
  }
}
