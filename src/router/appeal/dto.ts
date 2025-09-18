import { IsNotEmpty, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'

export class AppealDto {
  @IsNotEmpty({ message: '名称不能为空' })
  name!: string
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  status?: number
  @Transform(({ value }) => Number(value))
  sort?: number
  @Transform(({ value }) => Number(value))
  id?: number
}

export class AppealAdviceDto {
  @IsNotEmpty({ message: '类型type不能为空' })
  @Transform(({ value }) => Number(value))
  type!: number
  id?: number
  @IsNotEmpty({ message: '内容content不能为空' })
  content!: string
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  status?: number
  @Transform(({ value }) => Number(value))
  article_id?: number
  @Transform(({ value }) => Number(value))
  func_id?: number
  @Transform(({ value }) => Number(value))
  letter_id?: number
  @IsNotEmpty({ message: 'target_id不能为空' })
  @Transform(({ value }) => Number(value))
  target_id!: number
  @IsNotEmpty({ message: 'appeals不能为空' })
  appeals!: number[]
}

export class UpdateAdviceDto {
  @IsNotEmpty({ message: 'ids不能为空' })
  ids!: number[]
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  @IsNotEmpty({ message: '状态status不能为空' })
  status?: number
}
