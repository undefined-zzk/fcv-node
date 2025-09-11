import { IsNotEmpty, IsNumber, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateFrameFuncDto {
  @IsNotEmpty({ message: '名称不能为空' })
  @MaxLength(20, { message: '名称长度不能超过20' })
  name!: string
  @IsNotEmpty({ message: '描述不能为空' })
  @MaxLength(200, { message: '描述长度不能超过200' })
  desc!: string
  @IsNotEmpty({ message: '代码不能为空' })
  code!: string
  @IsNotEmpty({ message: '封面不能为空' })
  cover!: string
  @IsNotEmpty({ message: '思维方式不能为空' })
  mentality!: string
  @IsNotEmpty({ message: '标签要是数组不能为空' })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [Number(value)].filter((item) => item)
    return value
      .map((item: string | number) => Number(item))
      .filter((item) => Number.isInteger(item))
  })
  tags!: number[]
  @IsNotEmpty({ message: '分类id不能为空' })
  classify_id!: number
  id?: number
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 2) {
      return 1
    }
    return val
  })
  status?: number
  @IsNotEmpty({ message: '组件路径不能为空' })
  component_path!: string
}

export class UpdateStatusDto {
  @IsNotEmpty({ message: 'id不能为空' })
  id!: number
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: '状态只能是0或1' }
  )
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 2) {
      return 1
    }
    return val
  })
  status!: number
}

export class LikeCollectDto {
  @IsNotEmpty({ message: 'frame_func_id不能为空' })
  @IsNumber({}, { message: 'id只能是数字' })
  @Transform(({ value }) => Number(value))
  frame_func_id!: number
  @IsNotEmpty({ message: '类型type(0/1)不能为空' })
  @IsNumber({}, { message: 'type只能是数字' })
  @Transform(({ value }) => {
    const val = Number(value)
    if (val > 1) {
      return 1
    } else {
      return val
    }
  })
  type!: number
}

export class CreateFuncCommentDto {
  @IsNotEmpty({ message: 'func_id不能为空' })
  @IsNumber({}, { message: 'id只能是数字' })
  @Transform(({ value }) => Number(value))
  func_id!: number
  @IsNotEmpty({ message: '评论内容不能为空' })
  content!: string
  @Transform(({ value }) => Number(value))
  pid?: number
  @Transform(({ value }) => Number(value))
  status?: number
}

export class CommentLikeDto {
  @IsNotEmpty({ message: '评论comment_id不能为空' })
  @IsNumber({}, { message: 'comment_id只能是数字' })
  @Transform(({ value }) => Number(value))
  comment_id!: number
  @IsNotEmpty({ message: '评论comment_pid不能为空' })
  @IsNumber({}, { message: 'comment_pid只能是数字' })
  @Transform(({ value }) => Number(value))
  comment_pid!: number
  @IsNotEmpty({ message: '类型type(0/1)不能为空' })
  @IsNumber({}, { message: 'type只能是数字' })
  @Transform(({ value }) => Number(value))
  type!: number
  @Transform(({ value }) => Number(value))
  article_id?: number
  @Transform(({ value }) => Number(value))
  func_id?: number
}
