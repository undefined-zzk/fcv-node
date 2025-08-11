import { PrismaClient } from '@prisma/client'
import { inject } from 'inversify'
export class PrismaDB {
  prisma: PrismaClient
  constructor(@inject('PrismaClient') PrismaClient: () => PrismaClient) {
    this.prisma = PrismaClient()
  }
}
