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
import {
  CreateFrameFuncDto,
  UpdateStatusDto,
  LikeCollectDto,
  CreateFuncCommentDto,
  CommentLikeDto,
} from './dto'
import ts from 'node_modules/typescript/lib/typescript'

export class FrameFuncService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async getFrameFuncService(req: Request, res: Response) {
    const query = req.query as unknown as Page
    const { pageNum, pageSize, sort, startTime, endTime, all, status } =
      handlePage(query)
    let result = []
    const classify_id = query.classify_id ? +query.classify_id : undefined
    const hotsort = query.hotsort || undefined

    const where = {
      name: { contains: query.title || '' },
      create_time: {
        gte: startTime || undefined,
        lte: endTime || undefined,
      },
      status,
      classify_id,
    }
    const orderBy = [
      { likes: hotsort },
      { collects: hotsort },
      { sort },
      { create_time: sort },
    ]
    const total = await this.prismaDB.prisma.frameFunc.count({
      where: {
        classify_id,
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
        id: { not: +createFrameFuncDto.id },
      },
      distinct: ['name'],
    })
    if (exits) {
      return sendFail(res, 400, '名称已存在')
    }
    const { id, classify_id, ...updateDto } = createFrameFuncDto
    const reuslt = await this.prismaDB.prisma.frameFunc.update({
      where: {
        id: +id,
      },
      data: {
        ...updateDto,
        tags: {
          connect: createFrameFuncDto.tags.map((tagId) => ({ id: +tagId })),
        },
        frame_classify: {
          connect: { id: +classify_id },
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
  public async getFrameFuncDetail(req: Request, res: Response) {
    const query = req.query as unknown as { func_id: number; phone: string }
    const { func_id, phone } = query
    if (!func_id) return sendFail(res, 400, 'id不能为空')
    const result = await this.prismaDB.prisma.frameFunc.findUnique({
      where: { id: +func_id },
      include: {
        tags: true,
        frame_classify: true,
      },
    })
    if (!result) return sendFail(res, 404, '该功能不存在')
    const user = await this.prismaDB.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
      },
    })
    if (user) {
      const likeStatus =
        await this.prismaDB.prisma.frameFuncLikeCollect.findFirst({
          where: {
            user_id: user.id,
            frame_func_id: +func_id,
            type: 0,
          },
        })

      const collectStatus =
        await this.prismaDB.prisma.frameFuncLikeCollect.findFirst({
          where: {
            user_id: user.id,
            frame_func_id: +func_id,
            type: 1,
          },
        })
      // @ts-ignore
      result.like_status = likeStatus ? 0 : 1
      // @ts-ignore
      result.collect_status = collectStatus ? 0 : 1
    } else {
      // @ts-ignore
      result.like_status = 1
      // @ts-ignore
      result.collect_status = 1
    }
    return sendSuccess(res, result)
  }
  public async addComment(req: Request, res: Response) {
    const commentDto = plainToClass(CreateFuncCommentDto, req.body)
    const errors = await validate(commentDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    const { func_id } = commentDto
    const userInfo = await this.prismaDB.prisma.user.findUnique({
      where: { id: +user.id },
      select: { id: true, comment_status: true },
    })
    if (!userInfo) return sendFail(res, 400, '用户不正确,禁止评论')
    if (userInfo.comment_status == 1)
      return sendFail(res, 403, '您已被禁言禁止评论,请联系管理员')
    const exits = await this.prismaDB.prisma.frameFunc.findUnique({
      where: { id: +func_id },
    })
    if (!exits) return sendFail(res, 400, '该功能不存在，禁止评论')
    if (exits.status === 2) return sendFail(res, 400, '该功能已下线，禁止评论')
    const pComment = await this.prismaDB.prisma.frameComment.findUnique({
      where: { id: commentDto.pid },
    })
    if (commentDto.pid && !pComment) return sendFail(res, 400, '父评论不存在')
    if (commentDto.pid && pComment?.status === 2)
      return sendFail(res, 400, '该评论已封禁，禁止回复')
    const result = await this.prismaDB.prisma.frameComment.create({
      data: {
        ...commentDto,
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
    const total = await this.prismaDB.prisma.frameComment.count({
      where: { func_id: +id, pid: 0, status: 0 },
    })
    const allTotal = await this.prismaDB.prisma.frameComment.count({
      where: { func_id: +id, status: 0 },
    })
    // 查询所有正常一级评论
    const pResult = await this.prismaDB.prisma.frameComment.findMany({
      where: { func_id: +id, pid: 0, status: 0 },
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
      const children = await this.prismaDB.prisma.frameComment.findMany({
        where: { func_id: +id, pid: pItem.id, status: 0 },
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
                func_id: +id,
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
              func_id: +id,
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

  public async likeComment(req: Request, res: Response) {
    const commentLike = plainToClass(CommentLikeDto, req.body)
    const errors = await validate(commentLike)
    if (errors.length > 0) return sendError(res, errors)
    const { func_id, type, comment_id, comment_pid, article_id } = commentLike
    const user = req.user as any
    if (type === 0) {
      // 文章
      if (!article_id) return sendFail(res, 400, 'article_id错误')
      const article = await this.prismaDB.prisma.article.findUnique({
        where: { id: +article_id, status: 0 },
      })
      if (!article) return sendFail(res, 400, '文章已下线')
      const comment = await this.prismaDB.prisma.articleComment.findUnique({
        where: { id: +comment_id, status: 0 },
      })
      if (!comment) return sendFail(res, 400, '评论已经封禁,禁止点赞')
      const unique =
        await this.prismaDB.prisma.frameArticleCommentLike.findFirst({
          where: {
            comment_id: comment_id,
            comment_pid: comment_pid,
            article_id: article_id,
            user_id: user.id,
          },
        })
      if (unique) {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameArticleCommentLike.delete({
            where: { id: unique.id },
          }),
          this.prismaDB.prisma.articleComment.update({
            where: { id: comment_id },
            data: { likes: comment.likes - 1 },
          }),
        ])
      } else {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameArticleCommentLike.create({
            data: {
              ...commentLike,
              user_id: user.id,
              func_id: null,
            },
          }),
          this.prismaDB.prisma.articleComment.update({
            where: { id: comment_id },
            data: { likes: comment.likes + 1 },
          }),
        ])
      }
      return sendSuccess(
        res,
        unique ? '文章评论取消点赞成功' : '文章评论点赞成功'
      )
    } else {
      //功能
      if (!func_id) return sendFail(res, 400, 'func_id错误')
      const func = await this.prismaDB.prisma.frameFunc.findUnique({
        where: { id: +func_id, status: 0 },
      })
      if (!func) return sendFail(res, 400, '功能已下线')
      const comment = await this.prismaDB.prisma.frameComment.findUnique({
        where: { id: +comment_id, status: 0 },
      })
      if (!comment) return sendFail(res, 400, '评论已封禁,禁止点赞')
      const unique =
        await this.prismaDB.prisma.frameArticleCommentLike.findFirst({
          where: {
            comment_id: comment_id,
            comment_pid: comment_pid,
            func_id: func_id,
            user_id: user.id,
          },
        })
      if (unique) {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameArticleCommentLike.delete({
            where: { id: unique.id },
          }),
          this.prismaDB.prisma.frameComment.update({
            where: { id: comment_id },
            data: { likes: comment.likes - 1 },
          }),
        ])
      } else {
        await this.prismaDB.prisma.$transaction([
          this.prismaDB.prisma.frameArticleCommentLike.create({
            data: {
              ...commentLike,
              user_id: user.id,
              article_id: null,
            },
          }),
          this.prismaDB.prisma.frameComment.update({
            where: { id: comment_id },
            data: { likes: comment.likes + 1 },
          }),
        ])
      }
      return sendSuccess(
        res,
        unique ? '功能评论取消点赞成功' : '功能评论点赞成功'
      )
    }
  }
}
