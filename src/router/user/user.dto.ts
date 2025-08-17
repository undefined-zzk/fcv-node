import { IsNotEmpty, IsNumber, Matches, IsOptional } from 'class-validator'
import { Expose } from 'class-transformer'
export class UserLoginDto {
  constructor() {}
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha!: string
  captchaKey?: string
}

export class UserTokenDto {
  @IsNotEmpty({ message: 'refreshToken不能为空' })
  refreshToken!: string
  // @IsNotEmpty({ message: 'accessToken不能为空(可选)' })
  accessToken?: string
}

export class UserUpdateDto {
  @Expose()
  @IsOptional()
  nickname?: string
  @Expose()
  @IsOptional()
  update_time?: string
  @Expose()
  @IsOptional()
  last_login_time?: string
  @Expose()
  @IsOptional()
  intro?: string
  @Expose()
  @IsOptional()
  motto?: string
  @Expose()
  @IsOptional()
  ip?: string
  @Expose()
  @IsOptional()
  post?: string
  @Expose()
  @IsOptional()
  birthday?: string
  @Expose()
  @IsOptional()
  city?: string
  @Expose()
  @IsOptional()
  company?: string
  @Expose()
  @IsOptional()
  education?: string
  @Expose()
  @IsOptional()
  github?: string
  @Expose()
  @IsOptional()
  @IsNumber({ allowNaN: false }, { message: '毕业年份必须为数字' })
  graduate_year?: number
  @Expose()
  @IsOptional()
  major?: string
}

export class UpdateAvatarDto {
  @IsNotEmpty({ message: '头像不能为空' })
  avatar!: string
}
