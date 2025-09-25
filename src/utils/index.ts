import type { Response, Request } from 'express'
import jsyaml from 'js-yaml'
import fs from 'fs'
import crypto from 'crypto'
import svgCaptcha from 'svg-captcha'
import { Page } from 'src/types'
// 生成公钥和私钥
export const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })
  return {
    publicKey,
    privateKey,
  }
}

// 私钥解密
export const decryptWithPrivateKey = (encryptedData: string): string => {
  try {
    const {
      rsa: { privateKey },
    } = jsyaml.load(
      fs.readFileSync(process.cwd() + '/rsa.config.yaml', 'utf-8')
    ) as { rsa: { privateKey: string } }
    const buffer = Buffer.from(encryptedData, 'base64')
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    )
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('RSA解密失败:', error)
    throw new Error('解密失败，请检查私钥和加密数据是否正确')
  }
}

// 公钥加密
export const encryptWithPublicKey = (data: string): string => {
  try {
    const {
      rsa: { publicKey },
    } = jsyaml.load(
      fs.readFileSync(process.cwd() + '/rsa.config.yaml', 'utf-8')
    ) as { rsa: { publicKey: string } }
    const buffer = Buffer.from(data, 'utf8')
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    )
    return encrypted.toString('base64')
  } catch (error) {
    console.error('RSA加密失败:', error)
    throw new Error('加密失败，请检查公钥和数据是否正确')
  }
}

/**
 * 统一发送响应格式
 * @param code
 * @param msg
 * @param data
 * @returns
 */
export const sendSuccess = (res: Response, data: any) => {
  return res.send({
    code: 200,
    msg: 'success',
    data,
  })
}

/**
 * 处理数据校验
 */
export const sendError = (res: Response, errors: any[]) => {
  const err: string[] = []
  errors.forEach((item) => {
    if (item.constraints) {
      err.push(Object.values(item.constraints).join(','))
    }
  })
  return res.send({
    code: 400,
    msg: err.join(','),
    data: null,
  })
}

export const sendFail = (res: Response, code: number, msg: string) => {
  return res.status(200).send({
    code,
    msg,
    data: null,
  })
}

// 生成svg验证码
export const getSvgCaptcha = (options?: object) => {
  return svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
    width: 100,
    height: 32,
    color: true,
    fontSize: 40,
    background: '#ebf2fe',
    ...options,
  })
}

// 生成svg计算验证码
export const getMathSvgCaptcha = (options?: object) => {
  return svgCaptcha.createMathExpr({
    mathMin: 1, // 随机数最小值
    mathMax: 20, // 随机数最大值
    width: 100,
    height: 32,
    noise: 2,
    background: '#ebf2fe',
    color: true,
    fontSize: 40,
    mathOperator: '+-',
    ...options,
  })
}

// 解析 IP 的工具函数
export const getClientIp = (req: Request) => {
  return req.headers.host || req.hostname || req.ip || ''
}
const convertToIsoFormat = (dateTimeStr: string) => {
  // 把空格替换为 T，添加时区标识 Z（UTC）
  return new Date(dateTimeStr.replace(' ', 'T') + 'Z').toISOString()
}

// 处理分页
export const handlePage = (page: Page) => {
  let pageNum = 1
  let pageSize = 20
  let sort: 'asc' | 'desc' = 'desc'
  if (page.pageNum && page.pageNum > 0) pageNum = page.pageNum
  if (page.pageSize && page.pageSize > 0) {
    if (page.pageSize > 100) {
      page.pageSize = 100
    } else {
      pageSize = page.pageSize
    }
  }
  if (page.sort && ['asc', 'desc'].includes(page.sort)) sort = page.sort
  if (page.title) page.title = page.title.trim()
  if (page.startTime) page.startTime = convertToIsoFormat(page.startTime.trim())
  if (page.endTime) page.endTime = convertToIsoFormat(page.endTime.trim())
  if (page.status) page.status = +page.status
  if (page.all) page.all = +page.all
  page.pageNum = +pageNum
  page.pageSize = +pageSize
  page.sort = sort
  return page
}

// 判断是不是admin用户
export const isAdmin = (role: string[]) => {
  if (!role) return false
  return role.includes('admin')
}
