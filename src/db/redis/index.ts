import { Redis } from 'ioredis'

export class RedisDB {
  redis: any
  constructor() {
    this.init()
  }
  private init() {
    this.redis = new Redis({
      host: process.env.BASE_URL,
      port: Number(process.env.REDIS_PORT),
    })
  }
}
