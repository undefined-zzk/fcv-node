import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { RedisDB } from '../db/redis/index'
import { inject } from 'node_modules/inversify/lib/cjs'
export class JWT {
  private accessTokenSecret = process.env.ACCESSTOKENSECRET as any
  private refreshTokenSecret = process.env.REFRESHTOKENSECRET as any
  constructor(@inject(RedisDB) private redisDB: RedisDB) {
    this.strategy()
  }
  public signAccessToken(data: object) {
    return jwt.sign(data, this.accessTokenSecret, {
      expiresIn: process.env.ACCESSTOKENEXPIRESIN as any,
    })
  }
  public signRefreshToken(data: object) {
    return jwt.sign(data, this.refreshTokenSecret, {
      expiresIn: process.env.REFRESHTOKENEXPIRESIN as any,
    })
  }
  static middlewareToken() {
    return passport.authenticate('jwt', { session: false })
  }
  public verifyRefreshToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret)
      return decoded
    } catch (error) {}
  }
  public verifyAccessToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret)
      return decoded
    } catch (error) {}
  }
  public getTokens(user: any) {
    const tokenOptioins = {
      id: user.id,
      phone: user.phone,
      status: user.status,
    }
    const accessToken = this.signAccessToken(tokenOptioins)
    const refreshToken = this.signRefreshToken(tokenOptioins)
    this.redisDB.redis.set(
      `${user.id}:refreshToken`,
      refreshToken,
      'EX',
      Number(process.env.REFRESHTOKENEXPIRESIN_REDIS)
    )
    return { accessToken, refreshToken }
  }
  public strategy() {
    const _strategy = new Strategy(
      {
        secretOrKey: this.accessTokenSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      (jwt_payload, done) => {
        return done(null, jwt_payload)
      }
    )
    passport.use(_strategy)
  }
  public init() {
    return passport.initialize()
  }
}
