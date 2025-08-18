import { controller, httpPut, httpPost } from 'inversify-express-utils'
import { inject } from 'inversify'
import type { NextFunction, Request, Response } from 'express'
import { UploadFileService } from './service'
import { JWT } from '../../jwt/index'
import multer from 'multer'
import { v4 as uuid } from 'uuid'
import { extname } from 'path'
import { sendFail } from '../../utils/index'

const imageTypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/jpg',
]
const zipTypes = [
  'application/zip',
  'application/x-gzip',
  'application/x-7z-compressed',
  'application/x-zip-compressed',
]

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (imageTypes.includes(file.mimetype)) {
      cb(null, process.cwd() + '/src/static/image')
    } else if (zipTypes.includes(file.mimetype)) {
      cb(null, process.cwd() + '/src/static/zips')
    }
  },
  filename: function (req, file, cb) {
    cb(null, uuid() + extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1,
  },
  fileFilter: function (req, file, cb) {
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else if (zipTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  },
})
@controller('/file')
export class FileController {
  constructor(
    @inject(UploadFileService) private uploadFileService: UploadFileService
  ) {}
  @httpPut(
    '/avatar',
    upload.single('file'),
    multerErrMiddleware,
    JWT.middlewareToken()
  )
  uploadAvatarFile(req: Request, res: Response) {
    return this.uploadFileService.uploadAvatarFile(req, res, imageTypes)
  }
  @httpPost(
    '/upload',
    upload.single('file'),
    multerErrMiddleware,
    JWT.middlewareToken()
  )
  uploadFile(req: Request, res: Response) {
    return this.uploadFileService.uploadFile(req, res, imageTypes, zipTypes)
  }
}

function multerErrMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendFail(res, 400, '文件大小不超过1M')
    }
    return sendFail(res, 400, err.message)
  }
  next()
}
