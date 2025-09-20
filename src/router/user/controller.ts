import { controller, httpGet, httpPost, httpPut } from 'inversify-express-utils'
import { inject } from 'inversify'
import type { Request, Response } from 'express'
import { UserService } from './service'
import { JWT } from '../../jwt/index'
@controller('/user')
export class User {
  constructor(@inject(UserService) private userService: UserService) {}

  @httpGet('/list', JWT.middlewareToken())
  private async index(req: Request, res: Response) {
    return await this.userService.getUserList(req, res)
  }

  @httpGet('/publickey')
  private async getPublicKey(req: Request, res: Response) {
    return await this.userService.getPublicKey(req, res)
  }

  @httpGet('/captcha')
  private async getCapcha(req: Request, res: Response) {
    return await this.userService.getCaptcha(req, res)
  }
  // 获取手机验证码
  @httpGet('/phoneCode/:phone')
  private async getPhoneCode(req: Request, res: Response) {
    return await this.userService.getPhoneCode(req, res)
  }
  @httpPost('/register')
  private async register(req: Request, res: Response) {
    return await this.userService.register(req, res)
  }
  @httpPost('/login')
  private async login(req: Request, res: Response) {
    return await this.userService.login(req, res)
  }
  @httpPost('/refreshToken')
  private async refreshToken(req: Request, res: Response) {
    return await this.userService.refreshToken(req, res)
  }
  @httpPost('/logout', JWT.middlewareToken())
  private async logout(req: Request, res: Response) {
    return await this.userService.logout(req, res)
  }
  @httpGet('/userInfo/:id?', JWT.middlewareToken())
  private async getUserInfo(req: Request, res: Response) {
    return await this.userService.getUserInfo(req, res)
  }
  @httpPut('/update', JWT.middlewareToken())
  private async updateUserInfo(req: Request, res: Response) {
    return await this.userService.updateUserInfo(req, res)
  }
  @httpPut('/integral')
  private async updateIntegral(req: Request, res: Response) {
    return await this.userService.updateIntegral(req, res, undefined)
  }
}
