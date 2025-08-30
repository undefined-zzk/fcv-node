import { controller, httpGet } from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { HomeService } from './service'
@controller('/home')
export class HomeController {
  constructor(@inject(HomeService) private homeService: HomeService) {}
  @httpGet('/data')
  public async getHomeData(req: Request, res: Response) {
    return this.homeService.getHomeData(req, res)
  }
  @httpGet('/banners')
  public async getHomeBannerData(req: Request, res: Response) {
    return this.homeService.getHomeBannerData(req, res)
  }
}
