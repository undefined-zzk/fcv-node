import type { Request, Response } from 'express'
import { inject } from 'inversify'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { UserLoginDto, UserTokenDto, UserUpdateDto } from './user.dto'
import { PrismaDB } from '../../db/psimadb'
import { RedisDB } from '../../db/redis'
import { nanoid } from 'nanoid'
import {
  sendSuccess,
  sendError,
  getMathSvgCaptcha,
  sendFail,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getClientIp,
} from '../../utils/index'
import jsyaml from 'js-yaml'
import fs from 'fs'
import { JWT } from '../../jwt/index'
import { IntegralParams } from '../../types/index'
export class UserService {
  constructor(
    @inject(PrismaDB) private prismaDB: PrismaDB,
    @inject(RedisDB) private redisDB: RedisDB,
    @inject(JWT) private jwt: JWT
  ) {}

  public async getUserList(req: Request, res: Response) {
    const userDto = plainToClass(UserLoginDto, req.body, {
      excludeExtraneousValues: true, // 剔除UserDto中没定义的字段
    })
    const errors = await validate(userDto)
    if (errors.length > 0) {
      return sendError(res, errors)
    }
    const result = await this.prismaDB.prisma.user.findMany()
    res.send(result)
  }
  public async getPublicKey(req: Request, res: Response) {
    const rsaFile = fs.readFileSync(process.cwd() + '/rsa.config.yaml', 'utf-8')
    const fileObj = jsyaml.load(rsaFile) as { rsa: { publicKey: string } }
    return sendSuccess(res, fileObj.rsa.publicKey)
  }

  public async getCaptcha(req: Request, res: Response) {
    const { text, data } = getMathSvgCaptcha()
    const key = nanoid()
    this.redisDB.redis.set(key, text, 'EX', Number(process.env.CAPTCHA_REDIS))
    return sendSuccess(res, {
      svg: data,
      captchaKey: key,
    })
  }
  public async getPhoneCode(req: Request, res: Response) {
    const phone = req.params.phone
    if (!phone) return sendFail(res, 400, '手机号不正确')
    // const redisCode = await this.redisDB.redis.get(`code:${phone}`)
    // if (redisCode) return sendSuccess(res, '短信已发送')
    // 腾讯云短信 sdk
    const code = 8888
    this.redisDB.redis.set(
      `code:${phone}`,
      code,
      'EX',
      Number(process.env.PHONECODE_REDIS)
    )
    return sendSuccess(res, '短信已发送')
  }
  public async register(req: Request, res: Response) {
    const userDto = plainToClass(UserLoginDto, req.body)
    const errors = await validate(userDto)
    if (errors.length > 0) return sendError(res, errors)
    const { phone, password, captcha } = userDto

    const redisCode = await this.redisDB.redis.get(`code:${phone}`)
    if (!redisCode) return sendFail(res, 400, '验证码已过期')
    if (redisCode !== captcha) return sendFail(res, 400, '验证码不正确')
    const user = await this.prismaDB.prisma.user.findUnique({
      where: { phone },
    })
    if (user) return sendFail(res, 400, '用户已存在')
    const passwordHash = encryptWithPublicKey(password)
    await this.prismaDB.prisma.user.create({
      data: {
        phone: phone,
        password: passwordHash,
        ip: getClientIp(req),
      },
    })
    this.redisDB.redis.del(phone)
    this.redisDB.redis.del(`code:${phone}`)
    return sendSuccess(res, '注册成功')
  }
  private async injectLoginLog(req: Request, user: any, args: any) {
    return await this.prismaDB.prisma.loginLog.create({
      data: {
        phone: user.phone,
        login_time: new Date(),
        hostname: getClientIp(req),
        user_agent: req.headers['user-agent'],
        nickname: user.nickname,
        role: user.role?.toString(),
        user_id: user.id,
        ...args,
      },
    })
  }
  public async login(req: Request, res: Response) {
    const userDto = plainToClass(UserLoginDto, req.body)
    const errors = await validate(userDto)
    if (errors.length > 0) return sendError(res, errors)
    const { phone, password, captcha, captchaKey } = userDto
    const user = await this.prismaDB.prisma.user.findUnique({
      where: { phone },
    })
    if (!user) {
      return sendFail(res, 400, '该手机号未注册')
    }
    if (!captchaKey) return sendFail(res, 400, '缺少验证码captchaKey')
    const redisCode = await this.redisDB.redis.get(captchaKey)
    if (!redisCode) {
      await this.injectLoginLog(req, user, {
        result: 'fail',
        fail_reason: '验证码已过期',
      })
      return sendFail(res, 400, '验证码已过期')
    }
    if (redisCode !== captcha) {
      await this.injectLoginLog(req, user, {
        result: 'fail',
        fail_reason: '验证码不正确',
      })
      return sendFail(res, 400, '验证码不正确')
    }
    try {
      const decryptedPassword = decryptWithPrivateKey(user.password)
      const clientPassword = decryptWithPrivateKey(password)
      if (decryptedPassword !== clientPassword) {
        await this.injectLoginLog(req, user, {
          result: 'fail',
          fail_reason: '账号或者密码错误',
        })
        return sendFail(res, 400, '账号或者密码错误')
      }
      if (user.status == 1) {
        await this.injectLoginLog(req, user, {
          result: 'fail',
          fail_reason: '该账号已被禁用',
        })
        return sendFail(res, 403, '该账号已被禁用')
      }
      const redisRefreshToken = await this.redisDB.redis.get(
        `${user.id}:refreshToken`
      )
      await this.prismaDB.prisma.user.update({
        where: { id: user.id },
        data: { last_login_time: new Date() },
      })
      if (redisRefreshToken) {
        this.redisDB.redis.del(`${user.id}:refreshToken`)
      }
      const { accessToken, refreshToken } = this.jwt.getTokens(user)
      await this.injectLoginLog(req, user, {
        result: 'success',
        fail_reason: '',
      })
      return sendSuccess(res, {
        accessToken,
        refreshToken,
        expiresIn: Number(process.env.EXPIRESIN),
        expiresTime:
          Date.now() + Number(process.env.REFRESHTOKENEXPIRESIN_REDIS) * 1000,
      })
    } catch (error: any) {
      return sendFail(res, 500, error.message)
    }
  }
  public async refreshToken(req: Request, res: Response) {
    const userTokenDto = plainToClass(UserTokenDto, req.body)
    const errors = await validate(userTokenDto)
    if (errors.length > 0) return sendError(res, errors)
    const _refreshToken = userTokenDto.refreshToken
    const _accessToken = userTokenDto.accessToken
    if (_accessToken) {
      const accessUser = this.jwt.verifyAccessToken(_accessToken)
      if (accessUser) {
        return sendFail(res, 403, 'accessToken未过期')
      }
    }
    const user = this.jwt.verifyRefreshToken(_refreshToken)
    if (!user) {
      return sendFail(res, 401, '错误的refreshToken')
    }
    const redisRefreshToken = await this.redisDB.redis.get(
      `${user.id}:refreshToken`
    )
    if (!redisRefreshToken) {
      return sendFail(res, 401, 'refreshToken已过期')
    }
    const currentUser = await this.prismaDB.prisma.user.findUnique({
      where: { id: user.id },
    })
    if (currentUser?.status === 1) return sendFail(res, 403, '该账号已被禁用')
    const { accessToken, refreshToken } = this.jwt.getTokens(user)
    return sendSuccess(res, {
      accessToken,
      refreshToken,
      expiresIn: Number(process.env.EXPIRESIN),
      expiresTime:
        Date.now() + Number(process.env.REFRESHTOKENEXPIRESIN_REDIS) * 1000,
    })
  }
  public async logout(req: Request, res: Response) {
    const user = req.user as any
    this.redisDB.redis.del(`${user.id}:refreshToken`)
    return sendSuccess(res, '退出成功')
  }
  public async getUserInfo(req: Request, res: Response) {
    let user = req.user as any
    if (req.params.id) {
      user.id = +req.params.id
    }
    const userInfo = await this.prismaDB.prisma.user.findUnique({
      where: { id: user.id },
      omit: { password: true, id: true },
      include: {
        accounts: {
          where: {
            user_id: user.id,
          },
          select: {
            balance: true,
          },
        },
        followers: true,
        following: true,
      },
    })
    if (!userInfo) return sendFail(res, 400, '用户信息不存在')
    if (userInfo.status === 1) return sendFail(res, 403, '该账号已被禁用')
    const balance = +userInfo.accounts[0]?.balance || 0
    const fans = userInfo.following.length
    const attention = userInfo.followers.length
    // const integral=0 //积分
    // const praise=0 //获赞数
    // const rank=0 //排名
    return sendSuccess(res, {
      ...userInfo,
      balance,
      accounts: [],
      followers: [],
      following: [],
      fans,
      attention,
    })
  }
  public async updateUserInfo(req: Request, res: Response) {
    const userUpdateDto = plainToClass(UserUpdateDto, req.body, {
      excludeExtraneousValues: true,
    })
    const errors = await validate(userUpdateDto)
    if (errors.length > 0) return sendError(res, errors)
    const user = req.user as any
    try {
      const findUser = await this.prismaDB.prisma.user.findUnique({
        where: { id: user.id },
      })
      if (!findUser) return sendFail(res, 400, '用户信息不存在')
      if (findUser.status === 1) return sendFail(res, 403, '该账号已被禁用')
      await this.prismaDB.prisma.user.update({
        where: { id: user.id },
        data: {
          ...userUpdateDto,
          update_time: new Date(),
        },
      })
      const userInfo = await this.prismaDB.prisma.user.findUnique({
        where: { id: user.id },
        omit: { password: true, id: true },
      })
      return sendSuccess(res, userInfo)
    } catch (error) {
      console.log('error', error)
      return sendFail(res, 400, '更新失败')
    }
  }

  public async updateIntegral(
    req: Request,
    res: Response,
    integralParams: IntegralParams | undefined
  ) {
    if (integralParams) {
      const { integral, user_id, ...rest } = integralParams
      const user = await this.prismaDB.prisma.user.findUnique({
        where: { id: +user_id },
      })
      await this.prismaDB.prisma.$transaction([
        this.prismaDB.prisma.user.update({
          where: { id: +user_id },
          data: {
            integral: ((user!.integral as number) += 2),
            integrals: {
              create: {
                integral,
                ...rest,
              },
            },
          },
        }),
      ])
    } else {
      return sendSuccess(res, 'ok')
    }
  }
}
