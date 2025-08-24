import { IsNotEmpty, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'

export class AddFuncClassifyDto {
  @IsNotEmpty({ message: '名称不能为空' })
  name!: string
  id?: number
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  status?: number
  @IsNotEmpty({ message: '路由地址不能为空' })
  path!: string
  @IsNotEmpty({ message: '封面不能为空' })
  cover!: string
  @Transform(({ value }) => Number(value))
  sort?: number
}
