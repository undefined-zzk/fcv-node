import {
  controller,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { FrameFuncService } from './service'
import { authMiddleware } from '../../middleware/auth'
import { JWT } from '../../jwt/index'
@controller('/framefunc')
export class FrameFuncController {
  constructor(
    @inject(FrameFuncService) private frameFuncService: FrameFuncService
  ) {}
  @httpGet('/list')
  public async getFrameFunc(req: Request, res: Response) {
    return this.frameFuncService.getFrameFuncService(req, res)
  }
  @httpGet('/detail/:id')
  public async getFrameFuncDetail(req: Request, res: Response) {
    return this.frameFuncService.getFrameFuncDetail(req, res)
  }
  @httpPost('/create', JWT.middlewareToken(), authMiddleware)
  public async addFrameFunc(req: Request, res: Response) {
    return this.frameFuncService.addFrameFunc(req, res)
  }
  @httpPut('/update', JWT.middlewareToken(), authMiddleware)
  public async updateFrameFunc(req: Request, res: Response) {
    return this.frameFuncService.updateFrameFunc(req, res)
  }
  @httpPut('/status', JWT.middlewareToken(), authMiddleware)
  public async updateFrameFuncStatus(req: Request, res: Response) {
    return this.frameFuncService.updateFrameFuncStatus(req, res)
  }
  @httpDelete('/delete', JWT.middlewareToken(), authMiddleware)
  public async deleteFrameFunc(req: Request, res: Response) {
    return this.frameFuncService.deleteFrameFunc(req, res)
  }
  @httpGet('/hots')
  public async getFrameFuncHot(req: Request, res: Response) {
    return this.frameFuncService.getFrameFuncHot(req, res)
  }
  @httpPost('/likesCollects', JWT.middlewareToken())
  public async likesCollects(req: Request, res: Response) {
    return this.frameFuncService.likesCollects(req, res)
  }
  @httpPost('/createComment', JWT.middlewareToken())
  public async addComment(req: Request, res: Response) {
    return this.frameFuncService.addComment(req, res)
  }
  @httpGet('/commentList/:id')
  public async getCommentList(req: Request, res: Response) {
    return this.frameFuncService.getCommentList(req, res)
  }

  @httpPut('/like', JWT.middlewareToken())
  public async like(req: Request, res: Response) {
    return this.frameFuncService.likeComment(req, res)
  }
}
