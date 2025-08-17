import type { Request, Response } from 'express'
import { inject } from 'inversify'
import { PrismaDB } from '../../db/psimadb'
import { sendSuccess } from 'src/utils'
export class UploadFileService {
  constructor(@inject(PrismaDB) private prismaDB: PrismaDB) {}
  public async uploadAvatarFile(
    req: Request,
    res: Response,
    imageTypes: string[]
  ) {
    const user = req.user as any
    if (!req.file || !imageTypes.includes(req.file.mimetype))
      return res.status(400).send({ message: '文件格式错误' })
    const path = `/static/image/${req.file.filename}`
    await this.prismaDB.prisma.user.update({
      where: { id: user.id },
      data: { avatar: path },
    })
    return sendSuccess(res, path)
  }
}
