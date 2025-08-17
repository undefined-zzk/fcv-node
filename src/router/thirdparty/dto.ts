import { IsNotEmpty } from 'class-validator'
export class CollegesDto {
  @IsNotEmpty({ message: '学校名称不能为空' })
  keyword!: string
}
