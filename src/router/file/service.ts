import type { Request, Response } from 'express'
import { inject } from 'inversify'
import { PrismaDB } from '../../db/psimadb'
import {
  sendError,
  sendFail,
  sendSuccess,
  handlePage,
  isAdmin,
} from '../../utils/index'
import { CreateBannerDto } from './dto'
import { plainToClass } from 'class-transformer'
import { validate, isNumber } from 'class-validator'
import type { Page } from '../../types/index'
import { stat } from 'fs'
export class UploadFileService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async uploadAvatarFile(
    req: Request,
    res: Response,
    imageTypes: string[]
  ) {
    const user = req.user as any
    if (!req.file || !imageTypes.includes(req.file.mimetype))
      return res.status(400).send({ message: '文件格式错误' })
    const path = `/static/image/${req.file.filename}`
    await this.prismaDB.prisma.user.update({
      where: { id: user.id },
      data: { avatar: path },
    })
    return sendSuccess(res, path)
  }

  public async uploadFile(
    req: Request,
    res: Response,
    imageTypes: string[],
    zipTypes: string[]
  ) {
    if (!req.file) return sendFail(res, 400, '文件不能为空或格式不支持')
    if (
      !imageTypes.includes(req.file.mimetype) &&
      !zipTypes.includes(req.file.mimetype)
    ) {
      return sendFail(res, 400, '文件格式错误')
    }
    let path = `/static/image/${req.file.filename}`
    if (zipTypes.includes(req.file.mimetype)) {
      path = `/static/zips/${req.file.filename}`
    }
    return sendSuccess(res, path)
  }
  public async createBanner(req: Request, res: Response) {
    const banner = plainToClass(CreateBannerDto, req.body)
    const errors = await validate(banner)
    if (errors.length > 0) return sendError(res, errors)
    const { id, ...rest } = banner
    const result = await this.prismaDB.prisma.banner.create({ data: rest })
    return sendSuccess(res, result)
  }
  public async updateBanner(req: Request, res: Response) {
    const banner = plainToClass(CreateBannerDto, req.body)
    const errors = await validate(banner)
    if (errors.length > 0) return sendError(res, errors)
    if (!banner.id) return sendFail(res, 400, 'id不能为空')
    const exits = await this.prismaDB.prisma.banner.findUnique({
      where: { id: +banner.id },
    })
    if (!exits) return sendFail(res, 400, 'banner不存在')
    const { id, ...rest } = banner
    const result = await this.prismaDB.prisma.banner.update({
      where: { id: exits.id },
      data: rest,
    })
    return sendSuccess(res, result)
  }
  public async deleteBanner(req: Request, res: Response) {
    const ids = req.query.ids
    if (!ids) return sendFail(res, 400, '缺少帖子query参数ids')
    const id = (ids as string).split(',').map((id) => +id)
    if (!id.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    const existIds = await this.prismaDB.prisma.banner.findMany({
      where: { id: { in: id } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    if (delIds.length === 0) return sendFail(res, 400, 'ids不存在')
    const result = await this.prismaDB.prisma.banner.deleteMany({
      where: { id: { in: delIds } },
    })
    return sendSuccess(res, result)
  }
  public async getBannerList(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, startTime, endTime, all, status } =
      handlePage(query)
    const where = {
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
      status,
    }

    const total = await this.prismaDB.prisma.banner.count({
      where,
    })
    let result: any[] = []
    if (all > 0) {
      result = await this.prismaDB.prisma.banner.findMany({
        where: {
          ...where,
          status: 0,
        },
      })
    } else {
      result = await this.prismaDB.prisma.banner.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
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
