import { controller, httpGet, httpPut, httpPost } from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { JWT } from '../../jwt/index'
import { ArticleService } from './service'
@controller('/article')
export class ArticleController {
  constructor(@inject(ArticleService) private articleService: ArticleService) {}
  @httpPost('/publish')
  public async publishArticle(req: Request, res: Response) {
    return this.articleService.publishArticle(req, res)
  }
}
