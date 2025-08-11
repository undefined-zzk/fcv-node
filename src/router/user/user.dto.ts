import { IsNotEmpty, Matches } from 'class-validator'
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
