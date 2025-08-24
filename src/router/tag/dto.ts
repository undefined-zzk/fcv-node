import { IsNotEmpty, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'
export class TagCreateDto {
  @IsNotEmpty({ message: '标签名不能为空' })
  name!: string
}

export class TagUpdateDto {
  @IsNotEmpty({ message: '标签名不能为空' })
  name!: string
  @IsNotEmpty({ message: '标签id不能为空' })
  id!: number
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
    },
    { message: 'status只能是0或1' }
  )
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    }
    return val
  })
  status?: number
}
