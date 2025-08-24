import {
  controller,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { FuncClassifyService } from './service'
import { authMiddleware } from '../../middleware/auth'
import { JWT } from '../../jwt/index'
@controller('/funcclassify')
export class FuncClassifyController {
  constructor(
    @inject(FuncClassifyService)
    private funcClassifyService: FuncClassifyService
  ) {}
  @httpGet('/list', JWT.middlewareToken(), authMiddleware)
  public async getFrameFunc(req: Request, res: Response) {
    return this.funcClassifyService.frameFuncService(req, res)
  }

  @httpPost('/add', JWT.middlewareToken(), authMiddleware)
  public async addFrameFunc(req: Request, res: Response) {
    return this.funcClassifyService.addFrameFunc(req, res)
  }
  @httpPut('/update', JWT.middlewareToken(), authMiddleware)
  public async updateFrameFunc(req: Request, res: Response) {
    return this.funcClassifyService.updateFrameFunc(req, res)
  }
  @httpDelete('/delete', JWT.middlewareToken(), authMiddleware)
  public async deleteFrameFunc(req: Request, res: Response) {
    return this.funcClassifyService.deleteFrameFunc(req, res)
  }
}
