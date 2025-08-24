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
@controller('/tag')
export class FrameFuncController {
  constructor(
    @inject(FrameFuncService) private frameFuncService: FrameFuncService
  ) {}
  @httpGet('/list')
  public async getFrameFunc(req: Request, res: Response) {
    return this.frameFuncService.frameFuncService(req, res)
  }
}
