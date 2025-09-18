import 'reflect-metadata'
import { Container } from 'inversify'
import { InversifyExpressServer } from 'inversify-express-utils'
import express from 'express'
import dotenv from 'dotenv'
import https from 'https'
import fs from 'fs'
import cors from 'cors'
import WS, { WebSocketServer } from 'ws'
import { PrismaClient } from '@prisma/client'
import { PrismaDB } from './db/psimadb'
import { RedisDB } from './db/redis'
import { JWT } from './jwt'
import path from 'path'
import loggerMiddleware from './middleware/logger'
// 声明全局类型以避免隐式 any 错误
declare global {
  // 可以根据实际需要调整 connections 的类型
  // 例如: interface Connections { [key: string]: any }
  var connections: Record<string, any>
}
// controll
import './router/user/controller' // inversify-express-utils @5.0.0以后不需要手动绑定到容器
import './router/thirdparty/controller'
import './router/file/controller'
import './router/article/controller'
import './router/tag/controller'
import './router/framefunc/controller'
import './router/funcclassify/controller'
import './router/home/controller'
import './router/appeal/controller'
// service
import { UserService } from './router/user/service'
import { ThirdpartyService } from './router/thirdparty/service'
import { UploadFileService } from './router/file/service'
import { ArticleService } from './router/article/service'
import { TagService } from './router/tag/service'
import { FrameFuncService } from './router/framefunc/service'
import { FuncClassifyService } from './router/funcclassify/service'
import { HomeService } from './router/home/service'
import { AppealService } from './router/appeal/service'
dotenv.config()

const container = new Container()

// 将PrismaClient绑定到容器注册为工厂函数
container.bind<PrismaClient>('PrismaClient').toFactory(() => {
  return () => new PrismaClient()
})

// 绑定到容器
// container-start
container.bind(UserService).to(UserService)
container.bind(ThirdpartyService).to(ThirdpartyService)
container.bind(UploadFileService).to(UploadFileService)
container.bind(ArticleService).to(ArticleService)
container.bind(TagService).to(TagService)
container.bind(FrameFuncService).to(FrameFuncService)
container.bind(FuncClassifyService).to(FuncClassifyService)
container.bind(HomeService).to(HomeService)
container.bind(AppealService).to(AppealService)
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
  app.use(loggerMiddleware)
})

const app = server.build()

// 开发调试 开启
const port = process.env.PORT || 3000

const appServer = app.listen(port, () => {
  console.log(
    `Server is running on port: http://${process.env.BASE_URL}:${port}`
  )
})

//  部署上线开启下面代码，启用https
// 读取SSL证书
// const options = {
//   key: fs.readFileSync(path.join(process.cwd(), '/ssl/zhouzhenkun.top.key')), // 私钥路径
//   cert: fs.readFileSync(path.join(process.cwd(), '/ssl/zhouzhenkun.top.pem')), // 证书路径
// }

// const port = process.env.PORT
// const appServer = https.createServer(options, app).listen(port, () => {
//   console.log(
//     `HTTPS Server is running on port: https://${process.env.BASE_URL}:${port}`
//   )
// })

const wss = new WebSocketServer({ server: appServer, path: '/ws' })

wss.on('connection', (ws) => {
  const { startCheck, stopCheck } = heartCheck(ws)
  startCheck()
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
      if (!connections[data.phone]) {
        connections[data.phone] = {}
      }
      // 处理用户处于登录状态但重新建立了新连接
      if (
        connections[data.phone] &&
        connections[data.phone].fingerprint &&
        connections[data.phone].fingerprint !== data.fingerprint
      ) {
        ws.send(
          JSON.stringify({
            type: 'logout',
            message: `您的账号于${
              connections[data.phone].time
            }在其它设备登录,如不是本人操作,请及时修改密码`,
          })
        )
      } else {
        connections[data.phone].fingerprint = data.fingerprint
      }
    } else if (data.type == 'heart') {
      // 心跳
    }
  })
  ws.on('close', (e) => {
    stopCheck()
    closeWs(ws)
  })
})

function heartCheck(ws: any) {
  let heartInterval: any = null
  return {
    startCheck: () => {
      heartInterval = setInterval(() => {
        if (ws.readyState === WS.OPEN) {
          ws.send(JSON.stringify({ type: 'heart', message: 'are you ok?' }))
        } else {
          clearInterval(heartInterval)
          heartInterval = null
        }
      }, 30000)
    },
    stopCheck: () => {
      clearInterval(heartInterval)
      heartInterval = null
    },
  }
}

function closeWs(ws: any) {
  const currentWs = Object.values(connections).find(
    (item) => item.socket === ws
  )
  if (currentWs) {
    delete connections[currentWs.phone]
    currentWs.socket.close()
  }
}
