import {
  controller,
  httpGet,
  httpPut,
  httpPost,
  httpDelete,
} from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { JWT } from '../../jwt/index'
import { ArticleService } from './service'
import { authMiddleware } from '../../middleware/auth'
@controller('/article')
export class ArticleController {
  constructor(@inject(ArticleService) private articleService: ArticleService) {}
  @httpPost('/publish', JWT.middlewareToken())
  public async publishArticle(req: Request, res: Response) {
    return this.articleService.publishArticle(req, res)
  }
  @httpPut('/update', JWT.middlewareToken())
  public async upadateArticle(req: Request, res: Response) {
    return this.articleService.upadateArticle(req, res)
  }
  @httpDelete('/delete', JWT.middlewareToken())
  public async deleteArticle(req: Request, res: Response) {
    return this.articleService.deleteArticle(req, res)
  }
  @httpGet('/list', JWT.middlewareToken())
  public async getArticleList(req: Request, res: Response) {
    return this.articleService.getArticleList(req, res)
  }
  @httpGet('/detail/:id', JWT.middlewareToken())
  public async getArticleDetail(req: Request, res: Response) {
    return this.articleService.getArticleDetail(req, res)
  }

  @httpPut('/updatestatus', JWT.middlewareToken(), authMiddleware)
  public async updateStatus(req: Request, res: Response) {
    return this.articleService.updateStatus(req, res)
  }
  // 点赞和收藏和踩踏
  @httpPost('/likecollect', JWT.middlewareToken())
  public async likecollect(req: Request, res: Response) {
    return this.articleService.likecollect(req, res)
  }
  @httpPost('/comment', JWT.middlewareToken())
  public async common(req: Request, res: Response) {
    return this.articleService.addComment(req, res)
  }
  @httpGet('/commentList/:id')
  public async getCommentList(req: Request, res: Response) {
    return this.articleService.getCommentList(req, res)
  }
  // 查询专栏列表
  @httpGet('/column')
  public async listColumn(req: Request, res: Response) {
    return this.articleService.listColumn(req, res)
  }
  // 创建专栏
  @httpPost('/column', JWT.middlewareToken())
  public async addColumn(req: Request, res: Response) {
    return this.articleService.addColumn(req, res)
  }
  // 删除专栏
  @httpDelete('/column', JWT.middlewareToken())
  public async delColumn(req: Request, res: Response) {
    return this.articleService.delColumn(req, res)
  }
  @httpGet('/column/:id')
  public async columnDetail(req: Request, res: Response) {
    return this.articleService.columnDetail(req, res)
  }
  // 获取用户收藏列表（包括功能）
  @httpGet('/collects')
  public async listCollects(req: Request, res: Response) {
    return this.articleService.listCollects(req, res)
  }
}
