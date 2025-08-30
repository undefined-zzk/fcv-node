import { inject } from 'inversify'
import { sendSuccess, sendFail } from '../../utils/index'
import type { Request, Response } from 'express'
import { PrismaDB } from '../../db/psimadb'

export class HomeService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async getHomeData(req: Request, res: Response) {
    const result: any = {
      banners: [],
      funclassify: [],
      hots: [],
      reasons: [],
      evaluates: [],
    }
    const [banners, funclassify, hots] = await Promise.all([
      this.prismaDB.prisma.banner.findMany({
        where: { status: 0 },
        orderBy: { sort: 'desc' },
        omit: { create_time: true, update_time: true },
      }),
      this.prismaDB.prisma.frameClassify.findMany({
        where: { status: 0 },
        orderBy: { sort: 'desc' },
        omit: { create_time: true, update_time: true },
      }),
      this.prismaDB.prisma.frameFunc.findMany({
        skip: 0, // 跳过0条
        take: 8, // 只取8条
        where: {
          status: {
            not: 2, // 排除下线的
          },
        },
        omit: {
          create_time: true,
          update_time: true,
          code: true,
          mentality: true,
        },
        orderBy: [{ likes: 'desc' }, { collects: 'desc' }],
      }),
    ])
    result.banners = banners
    result.funclassify = funclassify
    result.hots = hots
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7天缓存
    res.setHeader('Expires', new Date(Date.now() + 604800000).toUTCString()) // 7天缓存
    return sendSuccess(res, result)
  }
  public async getHomeBannerData(req: Request, res: Response) {
    const banners = await this.prismaDB.prisma.banner.findMany({
      where: { status: 0 },
      orderBy: { sort: 'desc' },
      omit: { create_time: true, update_time: true },
    })
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7天缓存
    res.setHeader('Expires', new Date(Date.now() + 604800000).toUTCString()) // 7天缓存
    return sendSuccess(res, banners)
  }
}
