import { PrismaDB } from '../../db/psimadb/index'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import {
  sendError,
  sendSuccess,
  sendFail,
  handlePage,
  isAdmin,
} from '../../utils/index'
import {
  ArticlePublishDto,
  ArticleUpdateDto,
  UpdateArticleStatusDto,
  LikeCollectDto,
  AddCommentDto,
} from './dto'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { Page } from '../../types/index'
export class ArticleService {
  private LikeCollType: any = {
    '0': '点赞',
    '1': '收藏',
    '3': '踩踏',
  }
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async publishArticle(req: Request, res: Response) {
    const articlePublishDto = plainToClass(ArticlePublishDto, req.body)
    const errors = await validate(articlePublishDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    await this.prismaDB.prisma.article.create({
      data: {
        ...articlePublishDto,
        user_id: user.id,
        tags: {
          connect: articlePublishDto.tags.map((tagId) => ({ id: +tagId })),
        },
      },
    })
    return sendSuccess(res, articlePublishDto)
  }

  public async upadateArticle(req: Request, res: Response) {
    const articleUpdateDto = plainToClass(ArticleUpdateDto, req.body)
    const errors = await validate(articleUpdateDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    const article = await this.prismaDB.prisma.article.findUnique({
      where: { id: +articleUpdateDto.id },
    })
    if (!article) {
      return sendFail(res, 400, '帖子不存在')
    }
    if (article.status === 1)
      return sendFail(res, 400, '帖子已查封,无法修改请,有疑问请联系作者')
    const { id, ...updateDto } = articleUpdateDto
    await this.prismaDB.prisma.article.update({
      where: { id: +id, user_id: user.id },
      data: {
        ...updateDto,
        tags: {
          connect: articleUpdateDto.tags.map((tagId) => ({ id: +tagId })),
        },
      },
    })
    return sendSuccess(res, articleUpdateDto)
  }
  public async deleteArticle(req: Request, res: Response) {
    const articleIds = req.query.ids
    if (!articleIds) return sendFail(res, 400, '缺少帖子query参数ids')
    const ids = (articleIds as string).split(',').map((id) => +id)
    if (!ids.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    const existIds = await this.prismaDB.prisma.article.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    try {
      await this.prismaDB.prisma.article.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds.length}条数据${delIds}`)
  }
  public async getArticleList(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all } =
      handlePage(query)
    let articleList: any[] = []
    const user = req.user as any
    const where = {
      title: { contains: query.title || '' },
      user_id: isAdmin(user.role) ? undefined : user.id,
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
    }
    const orderBy = [{ create_time: sort }]
    if (all > 0) {
      articleList = await this.prismaDB.prisma.article.findMany({
        orderBy,
        where,
        distinct: ['title'],
      })
    } else {
      articleList = await this.prismaDB.prisma.article.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
        orderBy,
        distinct: ['title'],
      })
    }
    const total = await this.prismaDB.prisma.article.count({
      where: {
        status: 0,
      },
    })

    return sendSuccess(res, {
      list: articleList,
      total,
      pageNum,
      pageSize,
    })
  }

  public async getArticleDetail(req: Request, res: Response) {
    const id = req.params.id
    const user = req.user as any
    const article = await this.prismaDB.prisma.article.findUnique({
      where: { id: +id, status: isAdmin(user.role) ? undefined : 0 },
      include: {
        article_like_collects: {
          where: {
            article_id: +id,
          },
        },
        article_comments: {
          where: {
            article_id: +id,
            status: 0, // 审核通过的评论
          },
          select: { id: true }, // 评论id
        },
        tags: true,
        user: {
          select: { avatar: true, phone: true, nickname: true, id: true },
        },
      },
    })
    if (!article) return sendFail(res, 400, '帖子不存在或者被查封')
    const statistics: any = {
      likes: 0,
      collects: 0,
      no_likes: 0,
      userLikeStatus: null, // 当前用户对这篇帖子点赞状态
      userCollectStatus: null, // 当前用户对这篇帖子收藏状态
      userNoLikeStatus: null, // 当前用户对这篇帖子踩状态
      article_comments_nums: article.article_comments.length, // 评论数
    }
    article.article_like_collects.forEach((item) => {
      if (item.type === 0) {
        statistics.likes += 1 // 点赞数
        if (item.user_id === user.id) {
          statistics.userLikeStatus = item.type
        }
      }
      if (item.type === 1) {
        statistics.collects += 1 // 收藏数
        if (item.user_id === user.id) {
          statistics.userCollectStatus = item.type
        }
      }
      if (item.type === 2) {
        statistics.no_likes += 1 // 踩数数
        if (item.user_id === user.id) {
          statistics.userNoLikeStatus = item.type
        }
      }
    })
    await this.prismaDB.prisma.article.update({
      where: { id: article.id },
      data: { reads: article.reads + 1 },
    })
    return sendSuccess(res, { ...article, ...statistics })
  }
  public async updateStatus(req: Request, res: Response) {
    const user = req.user as any
    const updateDto = plainToClass(UpdateArticleStatusDto, req.body)
    const errors = await validate(updateDto)
    if (errors.length > 0) return sendError(res, errors)
    const exits = await this.prismaDB.prisma.article.findUnique({
      where: { id: +updateDto.id, user_id: user.id },
    })
    if (!exits) return sendFail(res, 400, '帖子不存在')
    await this.prismaDB.prisma.article.update({
      where: { id: exits.id, user_id: user.id },
      data: { status: +updateDto.status },
    })
    return sendSuccess(res, '更新成功')
  }
  public async likecollect(req: Request, res: Response) {
    const likecollect = plainToClass(LikeCollectDto, req.body)
    const errors = await validate(likecollect)
    if (errors.length > 0) return sendError(res, errors)
    const article = await this.prismaDB.prisma.article.findUnique({
      where: { id: +likecollect.article_id },
    })
    if (!article) return sendFail(res, 400, '帖子不存在')
    const user = req.user as any
    if (article.status === 1) {
      return sendFail(
        res,
        400,
        `帖子已查封,无法${this.LikeCollType[likecollect.type]}`
      )
    }
    const common = async (type: number) => {
      const exits = await this.prismaDB.prisma.articleLikeCollect.findMany({
        where: {
          article_id: +likecollect.article_id,
          user_id: user.id,
          type,
        },
      })
      if (exits.length == 0) {
        await this.prismaDB.prisma.articleLikeCollect.create({
          data: {
            article_id: +likecollect.article_id,
            user_id: user.id,
            type,
          },
        })
        const nolikes = await this.prismaDB.prisma.articleLikeCollect.findMany({
          where: {
            article_id: +likecollect.article_id,
            type: 2,
            user_id: user.id,
          },
        })
        const likes = await this.prismaDB.prisma.articleLikeCollect.findMany({
          where: {
            article_id: +likecollect.article_id,
            type: 0,
            user_id: user.id,
          },
        })
        if (type == 0 && nolikes.length > 0) {
          // 点赞就把踩踏删除
          await this.prismaDB.prisma.articleLikeCollect.deleteMany({
            where: {
              article_id: {
                in: [+likecollect.article_id],
              },
              user_id: {
                in: [user.id],
              },
              type: {
                in: [2],
              },
            },
          })
        }
        if (type == 2 && likes.length > 0) {
          // 踩踏就把点赞删除
          await this.prismaDB.prisma.articleLikeCollect.deleteMany({
            where: {
              article_id: {
                in: [+likecollect.article_id],
              },
              user_id: {
                in: [user.id],
              },
              type: {
                in: [0],
              },
            },
          })
        }
        return sendSuccess(
          res,
          `${type == 0 ? '点赞成功' : type == 1 ? '收藏成功' : '踩踏成功'}`
        )
      } else {
        await this.prismaDB.prisma.articleLikeCollect.deleteMany({
          where: {
            article_id: {
              in: [+likecollect.article_id],
            },
            user_id: {
              in: [user.id],
            },
            type: {
              in: [type],
            },
          },
        })
        return sendSuccess(
          res,
          `${
            type == 0
              ? '取消点赞成功'
              : type == 1
              ? '取消收藏成功'
              : '取消踩踏成功'
          }`
        )
      }
    }
    common(+likecollect.type)
  }

  public async addComment(req: Request, res: Response) {
    const commentDto = plainToClass(AddCommentDto, req.body)
    const errors = await validate(commentDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    const { article_id, article_pid, ...restCommentDto } = commentDto
    const exits = await this.prismaDB.prisma.article.findUnique({
      where: { id: +article_id, status: 0 },
    })
    if (!exits) return sendFail(res, 400, '该文章已封禁，禁止评论')
    const result = await this.prismaDB.prisma.articleComment.create({
      data: {
        ...restCommentDto,
        article_id: +article_id,
        pid: +article_pid!,
        user_id: user.id,
      },
    })
    return sendSuccess(res, result)
  }
}
