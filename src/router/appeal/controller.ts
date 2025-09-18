import {
  controller,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { AppealService } from './service'
import { authMiddleware } from '../../middleware/auth'
import { JWT } from '../../jwt/index'
@controller('/appeal')
export class AppealController {
  constructor(@inject(AppealService) private appealService: AppealService) {}
  @httpGet('/list')
  public async getFrameFunc(req: Request, res: Response) {
    return this.appealService.AppealListService(req, res)
  }
  @httpPost('/addupdate', JWT.middlewareToken(), authMiddleware)
  public async addFrameFunc(req: Request, res: Response) {
    return this.appealService.addAppealService(req, res)
  }

  @httpDelete('/delete', JWT.middlewareToken(), authMiddleware)
  public async deleteFrameFunc(req: Request, res: Response) {
    return this.appealService.deleteAppealService(req, res)
  }

  @httpPost('/report')
  public async reportFrameFunc(req: Request, res: Response) {
    return this.appealService.reportAppealService(req, res)
  }

  @httpPut('/updateReport')
  public async updateFrameFunc(req: Request, res: Response) {
    return this.appealService.updateReportAppealService(req, res)
  }

  @httpGet('/report')
  public async getReportFrameFunc(req: Request, res: Response) {
    return this.appealService.getReportAppealService(req, res)
  }
}
