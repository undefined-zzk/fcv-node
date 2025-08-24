import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { sendError, sendSuccess, sendFail, handlePage } from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'
import type { Page } from '../../types/index'
import { TagCreateDto, TagUpdateDto } from './dto'

export class TagService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async getTags(req: Request, res: Response) {
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
  public async getHotTags(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize } = handlePage(query)
    const result = await this.prismaDB.prisma.tag.findMany({
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      where: { status: 0, hot: { gt: 0 } },
      orderBy: { hot: 'desc' },
    })
    return sendSuccess(res, {
      list: result,
      pageNum,
      pageSize,
      total: result.length,
    })
  }
  public async addTag(req: Request, res: Response) {
    const tagDto = plainToClass(TagCreateDto, req.body)
    const errors = await validate(tagDto)
    if (errors.length > 0) return sendError(res, errors)
    // 检测名字是否重复
    const count = await this.prismaDB.prisma.tag.count({
      where: { name: tagDto.name },
    })
    if (count > 0) return sendFail(res, 400, '标签名已存在')
    const result = await this.prismaDB.prisma.tag.create({ data: tagDto })
    return sendSuccess(res, result)
  }

  public async updateTag(req: Request, res: Response) {
    const tagDto = plainToClass(TagUpdateDto, req.body)
    const errors = await validate(tagDto)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.tag.findUnique({
      where: { id: +tagDto.id },
    })
    if (!exits) return sendFail(res, 400, '标签不存在')
    const result = await this.prismaDB.prisma.tag.update({
      where: { id: exits.id },
      data: {
        ...tagDto,
        id: exits.id,
        status: tagDto.status,
      },
    })
    return sendSuccess(res, result)
  }
  public async deleteTag(req: Request, res: Response) {
    const tagIds = req.query.ids
    if (!tagIds) return sendFail(res, 400, '缺少帖子query参数ids')
    const ids = (tagIds as string).split(',').map((id) => +id)

    if (!ids.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    // 检测标签是否存在
    const existIds = await this.prismaDB.prisma.tag.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    if (existIds.length === 0) return sendFail(res, 400, '标签id都不存在')
    const delIds = existIds.map((item) => item.id)

    const hasArticleRelevances = await this.prismaDB.prisma.article.findMany({
      where: {
        tags: {
          some: { id: { in: delIds } },
        },
      },
    })
    if (hasArticleRelevances.length > 0) {
      return sendFail(res, 400, '标签下存在帖子,无法删除')
    }
    const hasFuncRelevances = await this.prismaDB.prisma.frameFunc.findMany({
      where: {
        tags: {
          some: { id: { in: delIds } },
        },
      },
    })
    if (hasFuncRelevances.length > 0) {
      return sendFail(res, 400, '标签下存在功能,无法删除')
    }
    try {
      await this.prismaDB.prisma.tag.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds}`)
  }
}
