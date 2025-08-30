import {
  controller,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { TagService } from './service'
import { authMiddleware } from '../../middleware/auth'
import { JWT } from '../../jwt/index'
@controller('/tag')
export class TagController {
  constructor(@inject(TagService) private tagService: TagService) {}
  @httpGet('/list', JWT.middlewareToken())
  public async getTags(req: Request, res: Response) {
    return this.tagService.getTags(req, res)
  }
  @httpGet('/hot')
  public async getHotTags(req: Request, res: Response) {
    return this.tagService.getHotTags(req, res)
  }
  @httpPost('/add', JWT.middlewareToken(), authMiddleware)
  public async addTag(req: Request, res: Response) {
    return this.tagService.addTag(req, res)
  }

  @httpPut('/update', JWT.middlewareToken(), authMiddleware)
  public async updateTag(req: Request, res: Response) {
    return this.tagService.updateTag(req, res)
  }

  @httpDelete('/delete', JWT.middlewareToken(), authMiddleware)
  public async deleteTag(req: Request, res: Response) {
    return this.tagService.deleteTag(req, res)
  }
}
