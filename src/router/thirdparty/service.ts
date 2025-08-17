import type { Request, Response } from 'express'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { CollegesDto } from './dto'
import crypto from 'crypto'
import { sendError, sendSuccess, sendFail } from '../../utils/index'
// import axios from 'axios'
import university from '../../data/university.json'
import major from '../../data/major.json'
import city from '../../data/city.json'
export class ThirdpartyService {
  constructor() {}
  public async getColleges(req: Request, res: Response) {
    return sendSuccess(res, university)
  }
  public async getMajors(req: Request, res: Response) {
    return sendSuccess(res, major)
  }

  public async getCity(req: Request, res: Response) {
    return sendSuccess(res, city)
  }
  public async getEnums(req: Request, res: Response) {
    return sendSuccess(res, {
      city,
      major,
      university,
    })
  }
}
