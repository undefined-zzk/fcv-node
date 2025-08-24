import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import {
  sendError,
  sendSuccess,
  sendFail,
  handlePage,
  isAdmin,
} from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'
import type { Page } from '../../types/index'
import { CreateFrameFuncDto, UpdateStatusDto, LikeCollectDto } from './dto'

export class FrameFuncService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async getFrameFuncService(req: Request, res: Response) {
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
    const orderBy = [{ create_time: sort }]
    const user = req.user as any
    const total = await this.prismaDB.prisma.frameFunc.count({
      where: {
        status: isAdmin(user.role) ? undefined : 0,
      },
    })
    if (all > 0) {
      result = await this.prismaDB.prisma.frameFunc.findMany({
        orderBy,
        where,
        distinct: ['name'],
        include: { tags: true, frame_classify: true },
      })
    } else {
      result = await this.prismaDB.prisma.frameFunc.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
        distinct: ['name'],
        orderBy,
        include: { tags: true, frame_classify: true },
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
    const createFrameFuncDto = plainToClass(CreateFrameFuncDto, req.body)
    const errors = await validate(createFrameFuncDto)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.frameFunc.findFirst({
      where: {
        name: createFrameFuncDto.name,
      },
      distinct: ['name'],
    })
    if (exits) {
      return sendFail(res, 400, '名称已存在')
    }
    const { id, classify_id, ...createDto } = createFrameFuncDto
    const reuslt = await this.prismaDB.prisma.frameFunc.create({
      data: {
        ...createDto,
        classify_id: +classify_id,
        tags: {
          connect: createDto.tags.map((tagId) => ({ id: +tagId })),
        },
      },
    })
    return sendSuccess(res, reuslt)
  }
  public async updateFrameFunc(req: Request, res: Response) {
    const createFrameFuncDto = plainToClass(CreateFrameFuncDto, req.body)
    const errors = await validate(createFrameFuncDto)
    if (errors.length > 0) return sendError(res, errors)
    if (!createFrameFuncDto.id) return sendFail(res, 400, 'id不能为空')
    const exits = await this.prismaDB.prisma.frameFunc.findFirst({
      where: {
        name: createFrameFuncDto.name,
      },
      distinct: ['name'],
    })
    if (exits) {
      return sendFail(res, 400, '名称已存在')
    }
    const { id, ...updateDto } = createFrameFuncDto
    const reuslt = await this.prismaDB.prisma.frameFunc.update({
      where: {
        id: +id,
      },
      data: {
        ...updateDto,
        tags: {
          connect: createFrameFuncDto.tags.map((tagId) => ({ id: +tagId })),
        },
      },
    })
    return sendSuccess(res, reuslt)
  }
  public async updateFrameFuncStatus(req: Request, res: Response) {
    const updateStatusDto = plainToClass(UpdateStatusDto, req.body)
    const errors = await validate(updateStatusDto)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.frameFunc.findUnique({
      where: { id: +updateStatusDto.id },
    })
    if (!exits) return sendFail(res, 400, 'id不存在')
    const result = await this.prismaDB.prisma.frameFunc.update({
      where: { id: exits.id },
      data: { status: +updateStatusDto.status },
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
    const existIds = await this.prismaDB.prisma.frameFunc.findMany({
      where: { id: { in: id } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    if (delIds.length === 0) return sendFail(res, 400, 'id都不存在')
    try {
      await this.prismaDB.prisma.frameFunc.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds.length}条数据${delIds}`)
  }

  public async getFrameFuncHot(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime } = handlePage(query)
    const where = {
      name: { contains: query.title || '' },
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
      status: {
        not: 2,
      },
    }
    const total = await this.prismaDB.prisma.frameFunc.count({
      where,
    })
    const result = await this.prismaDB.prisma.frameFunc.findMany({
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      where,
      distinct: ['name'],
      include: {
        tags: false,
        frame_classify: true,
      },
      orderBy: [{ likes: sort }, { collects: sort }],
    })
    return sendSuccess(res, {
      list: result,
      pageNum,
      pageSize,
      total,
    })
  }

  public async likesCollects(req: Request, res: Response) {
    const likecollect = plainToClass(LikeCollectDto, req.body)
    const errors = await validate(likecollect)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.frameFunc.findUnique({
      where: {
        id: +likecollect.frame_func_id,
      },
    })
    if (!exits) return sendFail(res, 400, '该功能不存在')
    if (exits.status === 2) return sendFail(res, 400, '该功能已下线')
    const user = req.user as any
    const like = await this.prismaDB.prisma.frameFuncLikeCollect.findFirst({
      where: {
        user_id: user.id,
        frame_func_id: +likecollect.frame_func_id,
        type: likecollect.type,
      },
    })
    try {
      if (like) {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameFuncLikeCollect.delete({
            where: {
              id: like.id,
            },
          }),
          this.prismaDB.prisma.frameFunc.update({
            where: {
              id: exits.id,
            },
            data: {
              likes: likecollect.type === 0 ? exits.likes - 1 : exits.likes,
              collects:
                likecollect.type === 0 ? exits.collects : exits.collects - 1,
            },
          }),
        ])
        return sendSuccess(
          res,
          `${likecollect.type === 0 ? '取消点赞' : '取消收藏'}成功`
        )
      } else {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameFuncLikeCollect.create({
            data: {
              user_id: user.id,
              frame_func_id: +likecollect.frame_func_id,
              type: likecollect.type,
            },
          }),
          this.prismaDB.prisma.frameFunc.update({
            where: {
              id: exits.id,
            },
            data: {
              likes: likecollect.type == 0 ? exits.likes + 1 : exits.likes,
              collects:
                likecollect.type === 0 ? exits.collects : exits.collects + 1,
            },
          }),
        ])
        return sendSuccess(
          res,
          `${likecollect.type === 0 ? '点赞' : '收藏'}成功`
        )
      }
    } catch (error: any) {
      return sendFail(res, 500, error)
    }
  }
}
