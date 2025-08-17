import { controller, httpGet, httpPost } from 'inversify-express-utils'
import type { Request, Response } from 'express'
import { inject } from 'inversify'
import { ThirdpartyService } from './service'
import { JWT } from '../../jwt/index'
@controller('/thirdparty')
export class ThirdpartyController {
  constructor(
    @inject(ThirdpartyService) private thirdpartyService: ThirdpartyService
  ) {}
  @httpGet('/colleges', JWT.middlewareToken())
  async getColleges(req: Request, res: Response) {
    return await this.thirdpartyService.getColleges(req, res)
  }
  @httpGet('/majors', JWT.middlewareToken())
  async getMajors(req: Request, res: Response) {
    return await this.thirdpartyService.getMajors(req, res)
  }
  @httpGet('/city', JWT.middlewareToken())
  async getCity(req: Request, res: Response) {
    return await this.thirdpartyService.getCity(req, res)
  }
  @httpGet('/enums', JWT.middlewareToken())
  async getEnums(req: Request, res: Response) {
    return await this.thirdpartyService.getEnums(req, res)
  }
}
