import { IsNotEmpty, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'
export class CreateBannerDto {
  @IsNotEmpty({ message: '路径不能为空' })
  path!: string
  @IsNotEmpty({ message: '排序不能为空' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: '排序只能是数字' }
  )
  @Transform(({ value }) => Number(value))
  sort?: number
  id?: number
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  status?: number
}
