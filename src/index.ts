import 'reflect-metadata'
import { Container } from 'inversify'
import { InversifyExpressServer } from 'inversify-express-utils'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { PrismaClient } from '@prisma/client'
import { PrismaDB } from './db/psimadb'
import { RedisDB } from './db/redis'
import { JWT } from './jwt'
// 声明全局类型以避免隐式 any 错误
declare global {
  // 可以根据实际需要调整 connections 的类型
  // 例如: interface Connections { [key: string]: any }
  var connections: Record<string, any>
}
// controll
import './router/user/controller' // inversify-express-utils @5.0.0以后不需要手动绑定到容器

// service
import { UserService } from './router/user/service'
import path from 'path'

dotenv.config()

const container = new Container()

// 将PrismaClient绑定到容器注册为工厂函数
container.bind<PrismaClient>('PrismaClient').toFactory(() => {
  return () => new PrismaClient()
})

// 绑定到容器
// container-start
container.bind(UserService).to(UserService)
container.bind(PrismaDB).to(PrismaDB)
container.bind(RedisDB).to(RedisDB) // 初始化redis
container.bind(JWT).to(JWT)
// container-end

// 全局变量 用户连接
globalThis.connections = {}

const server = new InversifyExpressServer(container, null, {
  rootPath: '/api/v1',
})

// 设置中间件
server.setConfig((app) => {
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(container.get(JWT).init())
  app.use('/static', express.static(path.join(process.cwd(), 'src/static')))
})

const app = server.build()

const port = process.env.PORT || 3000

const appServer = app.listen(port, () => {
  console.log(
    `Server is running on port: http://${process.env.BASE_URL}:${port}`
  )
})

const wss = new WebSocketServer({ server: appServer })

wss.on('connection', (ws) => {
  ws.on('message', (message: string) => {
    const data = JSON.parse(message)
    if (data.type === 'login') {
      if (
        connections[data.phone] &&
        connections[data.phone].fingerprint !== data.fingerprint
      ) {
        // 新设备登录
        connections[data.phone].socket.send(
          JSON.stringify({
            type: 'logout',
            message: `您的账号于${new Date().toLocaleString()}在其它设备登录,如不是本人操作,请及时修改密码`,
          })
        )
        connections[data.phone].fingerprint = data.fingerprint
        connections[data.phone].socket.close()
        connections[data.phone].socket = ws
        connections[data.phone].time = new Date().toLocaleString()
      } else {
        // 第一次登录
        connections[data.phone] = {
          socket: ws,
          phone: data.phone,
          fingerprint: data.fingerprint,
          time: new Date().toLocaleString(),
        }
      }
    } else if (data.type === 'logout') {
      delete connections[data.phone]
    } else if (data.type == 'open') {
      if (!connections[data.phone]) return
      // 处理用户处于登录状态但重新建立了新连接
      connections[data.phone].socket = ws
      connections[data.phone].time = new Date().toLocaleString()
      if (
        connections[data.phone] &&
        connections[data.phone].fingerprint !== data.fingerprint
      ) {
        connections[data.phone].socket.send(
          JSON.stringify({
            type: 'logout',
            message: `您的账号于${
              connections[data.phone].time
            }在其它设备登录,如不是本人操作,请及时修改密码`,
          })
        )
      }
      connections[data.phone].fingerprint = data.fingerprint
    }
  })
  ws.on('close', () => {
    // delConnection(ws)
  })
})
