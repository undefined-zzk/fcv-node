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
  SpeacilColumnDto,
} from './dto'
import { plainToClass } from 'class-transformer'
import { isNumber, validate } from 'class-validator'
import { Page } from '../../types/index'
import { UserService } from '../user/service'
export class ArticleService {
  private LikeCollType: any = {
    '0': '点赞',
    '1': '收藏',
    '2': '踩踏',
  }
  constructor(
    @inject(PrismaDB) private prismaDB: PrismaDB,
    @inject(UserService) private userService: UserService
  ) {}
  public async publishArticle(req: Request, res: Response) {
    const articlePublishDto = plainToClass(ArticlePublishDto, req.body)
    const errors = await validate(articlePublishDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    const { id, ...rest } = articlePublishDto
    try {
      const result = await this.prismaDB.prisma.article.create({
        data: {
          ...rest,
          user_id: user.id,
          tags: {
            connect: articlePublishDto.tags.map((tagId) => ({ id: +tagId })),
          },
        },
      })
      // 更新用户积分
      await this.userService.updateIntegral(req, res, {
        integral: 2,
        source: '发表了一篇文章',
        type: 0,
        user_id: user.id,
        source_id: result.id,
      })
      return sendSuccess(res, result)
    } catch (error) {
      sendFail(res, 400, String(error))
    }
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
      return sendFail(res, 400, '帖子已查封,无法修改,有疑问请联系作者')
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
    const phone = query.phone
    let user = req.user as any
    if (phone) {
      user = await this.prismaDB.prisma.user.findFirst({
        where: { phone },
        select: { id: true, phone: true, role: true, status: true },
      })
      if (!user) return sendFail(res, 400, '参数错误')
    }
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
        user_id: user.id,
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
      // 0 点赞 1 收藏 2 踩踏
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
    const updateArticle = async (data: {
      likes: number
      no_likes: number
      collects: number
    }) => {
      await this.prismaDB.prisma.article.update({
        where: {
          id: +likecollect.article_id,
        },
        data: {
          likes: (article.likes += data.likes),
          no_likes: (article.no_likes += data.no_likes),
          collects: (article.collects += data.collects),
        },
      })
    }
    const common = async (type: number) => {
      const exits = await this.prismaDB.prisma.articleLikeCollect.findMany({
        where: {
          article_id: +likecollect.article_id,
          user_id: user.id,
          type,
        },
      })
      console.log('exits', exits.length)
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
          await updateArticle({ likes: 1, no_likes: -1, collects: 0 })
        } else if (type == 2 && likes.length > 0) {
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
          await updateArticle({ likes: -1, no_likes: 1, collects: 0 })
        } else {
          if (type == 1) {
            // 收藏
            await updateArticle({ likes: 0, no_likes: 0, collects: 1 })
          } else if (type == 0) {
            // 点赞
            await updateArticle({ likes: 1, no_likes: 0, collects: 0 })
          } else {
            // 踩踏
            await updateArticle({ likes: 0, no_likes: 1, collects: 0 })
          }
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
        await updateArticle({
          likes: type == 0 ? -1 : 0,
          no_likes: type == 2 ? -1 : 0,
          collects: type == 1 ? -1 : 0,
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
    const { article_id, pid, ...restCommentDto } = commentDto
    const userInfo = await this.prismaDB.prisma.user.findUnique({
      where: { id: +user.id },
      select: { id: true, comment_status: true },
    })
    if (!userInfo) return sendFail(res, 400, '用户不正确,禁止评论')
    if (userInfo.comment_status == 1)
      return sendFail(res, 403, '您已被禁言禁止评论,请联系管理员')
    const exits = await this.prismaDB.prisma.article.findUnique({
      where: { id: +article_id, status: 0 },
    })
    if (!exits) return sendFail(res, 400, '该文章已封禁，禁止评论')
    const pComment = await this.prismaDB.prisma.articleComment.findUnique({
      where: { id: commentDto.pid },
    })
    if (commentDto.pid && !pComment) return sendFail(res, 400, '父评论不存在')
    if (commentDto.pid && pComment?.status === 2)
      return sendFail(res, 400, '该评论已封禁，禁止回复')
    const result = await this.prismaDB.prisma.articleComment.create({
      data: {
        ...restCommentDto,
        article_id: +article_id,
        pid: +pid!,
        user_id: user.id,
      },
    })
    return sendSuccess(res, result)
  }

  public async getCommentList(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, commentType } = handlePage(query)
    const { id } = req.params
    if (!id) return sendFail(res, 400, 'id不能为空')
    let create_time = undefined as any
    let likes = undefined as any
    if (commentType == 'latest') {
      create_time = 'desc'
    }
    if (commentType == 'hot') {
      likes = 'desc'
    }
    // 查询所有正常一级评论总数
    const total = await this.prismaDB.prisma.articleComment.count({
      where: { article_id: +id, pid: 0, status: 0 },
    })
    const allTotal = await this.prismaDB.prisma.articleComment.count({
      where: { article_id: +id, status: 0 },
    })
    // 查询所有正常一级评论
    const pResult = await this.prismaDB.prisma.articleComment.findMany({
      where: { article_id: +id, pid: 0, status: 0 },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: [{ create_time }, { likes }],
      include: {
        user: {
          select: {
            role: true,
            avatar: true,
            phone: true,
            nickname: true,
            intro: true,
            id: true,
            member: true,
          },
        },
      },
    })
    const user = await this.prismaDB.prisma.user.findFirst({
      where: { phone: query.phone },
      select: { id: true },
    })
    const getChildren = async (list: any[], pItem: any) => {
      const children = await this.prismaDB.prisma.articleComment.findMany({
        where: { article_id: +id, pid: pItem.id, status: 0 },
        include: {
          user: {
            select: {
              role: true,
              avatar: true,
              phone: true,
              nickname: true,
              intro: true,
              id: true,
              member: true,
            },
          },
        },
      })
      for (let i = 0; i < children.length; i++) {
        const item = children[i]
        // @ts-ignore
        item.reply_name = pItem.user.nickname || pItem.user.phone
        if (user) {
          const likeStatus =
            await this.prismaDB.prisma.frameArticleCommentLike.findFirst({
              where: {
                article_id: +id,
                comment_id: item.id,
                user_id: user?.id,
              },
            })
          // @ts-ignore
          item.like_status = likeStatus ? 0 : 1 // 0：点赞 1：未点赞
        } else {
          // @ts-ignore
          item.like_status = 1
        }
        await getChildren(list, item)
      }
      list.push(...children)
      return list
    }

    for (let i = 0; i < pResult.length; i++) {
      let list: any[] = []
      await getChildren(list, pResult[i])
      // @ts-ignore
      pResult[i].children = {
        list,
        total: list.length,
        pageNum,
        pageSize,
      }
      // @ts-ignore
      pResult[i].reply_name = null
      if (user) {
        const likeStatus =
          await this.prismaDB.prisma.frameArticleCommentLike.findFirst({
            where: {
              article_id: +id,
              comment_id: pResult[i].id,
              user_id: user?.id,
            },
          })
        // @ts-ignore
        pResult[i].like_status = likeStatus ? 0 : 1 // 0：点赞 1：未点赞
      } else {
        // @ts-ignore
        pResult[i].like_status = 1 // 0：点赞 1：未点赞
      }
    }
    return sendSuccess(res, {
      list: pResult,
      pageNum,
      pageSize,
      total,
      allTotal,
    })
  }

  public async listColumn(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all } =
      handlePage(query)
    let columnList: any[] = []
    const phone = query.phone
    if (!phone) return sendFail(res, 400, '缺少phone参数')
    const user = await this.prismaDB.prisma.user.findFirst({
      where: { phone },
      select: { id: true, phone: true, role: true, status: true },
    })
    if (!user) return sendFail(res, 400, 'phone不存在')
    const where = {
      name: { contains: query.title || '' },
      user_id: isAdmin(user.role as string[]) ? undefined : user.id,
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
    }
    const orderBy = [{ create_time: sort }]
    if (all > 0) {
      columnList = await this.prismaDB.prisma.specialColumn.findMany({
        orderBy,
        where,
        distinct: ['name'],
        include: {
          articles: true,
        },
      })
    } else {
      columnList = await this.prismaDB.prisma.specialColumn.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where,
        orderBy,
        include: {
          articles: true,
        },
        distinct: ['name'],
      })
    }
    const total = await this.prismaDB.prisma.specialColumn.count({
      where: {
        user_id: user.id,
      },
    })

    return sendSuccess(res, {
      list: columnList,
      total,
      pageNum,
      pageSize,
    })
  }

  public async addColumn(req: Request, res: Response) {
    const SpeacilColumn = plainToClass(SpeacilColumnDto, req.body)
    const errors = await validate(SpeacilColumn)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    const { name, id, articles, ...rest } = SpeacilColumn
    if (!id) {
      const exits = await this.prismaDB.prisma.specialColumn.findFirst({
        where: { name, user_id: +user.id },
      })
      if (exits) return sendFail(res, 400, '专栏名称重复')
      const result = await this.prismaDB.prisma.specialColumn.create({
        data: {
          ...rest,
          name,
          user_id: +user.id,
        },
      })
      return sendSuccess(res, result)
    } else {
      const exits = await this.prismaDB.prisma.specialColumn.findFirst({
        where: { user_id: +user.id, id: +id },
      })
      if (!exits) return sendFail(res, 400, '修改的专栏不存在')
      if (exits.name !== name) {
        const exitName = await this.prismaDB.prisma.specialColumn.findFirst({
          where: { name, user_id: +user.id },
        })
        if (exitName?.name === name) return sendFail(res, 400, '专栏名称重复')
      }
      if (!(articles instanceof Array))
        return sendFail(res, 400, 'articles参数错误')
      if (articles.length > 0) {
        if (!articles.every((k) => Number(k))) {
          return sendFail(res, 400, 'articles参数错误')
        }
        const issCurrentUserArticle =
          await this.prismaDB.prisma.article.findMany({
            where: {
              id: { in: articles.map((id) => +id) },
              user_id: +user.id,
            },
          })
        if (issCurrentUserArticle.length !== articles.length)
          return sendFail(res, 400, '添加的文章中存在其它用户的文章')
      }
      console.log('articles', articles)
      const update = await this.prismaDB.prisma.specialColumn.update({
        where: { id: +id, user_id: +user.id },
        data: {
          ...rest,
          name,
          articles: {
            set: articles.map((id) => ({ id: +id })),
          },
        },
      })
      return sendSuccess(res, update)
    }
  }

  public async delColumn(req: Request, res: Response) {
    const columnIds = req.query.ids
    if (!columnIds) return sendFail(res, 400, '缺少query参数ids')
    const ids = (columnIds as string).split(',').map((id) => +id)
    if (!ids.every((id) => isNumber(id) && Number.isInteger(id))) {
      return sendFail(res, 400, 'ids格式错误')
    }
    const existIds = await this.prismaDB.prisma.specialColumn.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const delIds = existIds.map((item) => item.id)
    try {
      await this.prismaDB.prisma.specialColumn.deleteMany({
        where: { id: { in: delIds } },
      })
    } catch (error: any) {
      return sendSuccess(res, error.meta)
    }
    return sendSuccess(res, `删除成功${delIds.length}条数据${delIds}`)
  }

  public async listCollects(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all } =
      handlePage(query)
    let columnList: any[] = []
    let total = 0
    const phone = query.phone
    if (!phone) return sendFail(res, 400, '缺少phone参数')
    const type = query.type
    if (type != 1 && type != 2) return sendFail(res, 400, 'type参数错误')
    const user = await this.prismaDB.prisma.user.findFirst({
      where: { phone },
      select: { id: true, phone: true, role: true, status: true },
    })
    if (!user) return sendFail(res, 400, 'phone不存在')
    const where = {
      user_id: isAdmin(user.role as string[]) ? undefined : user.id,
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
    }
    const orderBy = [{ create_time: sort }]
    const getArticleList = async (options: object = {}) => {
      columnList = await this.prismaDB.prisma.article.findMany({
        ...options,
        where: {
          ...where,
          article_like_collects: {
            some: {
              type: 1,
              user_id: user.id,
            },
          },
        },
        orderBy,
      })
      total = await this.prismaDB.prisma.article.count({
        where: {
          user_id: user.id,
          article_like_collects: {
            some: {
              type: 1,
              user_id: user.id,
            },
          },
        },
      })
    }

    const getFrameFuncList = async (options: object = {}) => {
      columnList = await this.prismaDB.prisma.frameFunc.findMany({
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        where: {
          create_time: {
            gte: startTime || undefined,
            lte: endTime || undefined,
          },
          framefunc_like_collects: {
            some: {
              user_id: user.id,
              type: 1,
            },
          },
        },
        orderBy,
      })
      total = await this.prismaDB.prisma.frameFunc.count({
        where: {
          framefunc_like_collects: {
            some: {
              user_id: user.id,
              type: 1,
            },
          },
        },
      })
    }
    if (all > 0) {
      if (type == 1) {
        // 文章
        await getArticleList()
      } else {
        await getFrameFuncList()
      }
    } else {
      if (type == 1) {
        await getArticleList({
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        })
      } else {
        await getFrameFuncList({
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        })
      }
    }

    return sendSuccess(res, {
      list: columnList,
      total,
      pageNum,
      pageSize,
    })
  }
  public async columnDetail(req: Request, res: Response) {
    const columnId = req.params.id
    const result = await this.prismaDB.prisma.specialColumn.findUnique({
      where: { id: +columnId },
      include: {
        articles: true,
        user: {
          select: {
            avatar: true,
            nickname: true,
            phone: true,
            id: true,
          },
        },
      },
    })
    if (!result) return sendFail(res, 400, '该专栏不存在')
    return sendSuccess(res, result)
  }
}
