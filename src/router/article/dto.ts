import { IsArray, IsNotEmpty, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'
export class ArticlePublishDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string
  @IsNotEmpty({ message: '内容不能为空' })
  content!: string
  cover?: string
  desc?: string
  @IsArray({ message: '标签要是数组不能为空' })
  tags!: number[]
  id?: number
}

export class ArticleUpdateDto {
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string
  @IsNotEmpty({ message: '内容不能为空' })
  content!: string
  cover?: string
  desc?: string
  @IsArray({ message: '标签要是数组不能为空' })
  tags!: number[]
  @IsNotEmpty({ message: '文章id不能为空' })
  id!: number
}

export class UpdateArticleStatusDto {
  @IsNotEmpty({ message: '文章id不能为空' })
  id!: number
  @IsNotEmpty({ message: '状态不能为空' })
  status!: number
}

export class LikeCollectDto {
  @IsNotEmpty({ message: '文章article_id不能为空' })
  article_id!: number
  // @IsNotEmpty({ message: '状态status不能为空' })
  // status!: number // 0是点赞和收藏，1是取消点赞和收藏
  @IsNotEmpty({ message: '类型type(0/1)不能为空' })
  type!: number
}

export class AddCommentDto {
  @IsNotEmpty({ message: '文章article_id不能为空' })
  article_id!: number
  @IsNotEmpty({ message: '评论内容不能为空' })
  content!: string
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'pid只能是数字' }
  )
  @Transform(({ value }) => Number(value))
  pid?: number
}
