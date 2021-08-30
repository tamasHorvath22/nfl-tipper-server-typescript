import { ChangePasswordDTO } from './../types/change-password.dto';
import { LoginDTO } from './../types/login-dto';
import { UserService } from './../services/user.service';
import { Body, Get, HeaderParam, JsonController, Param, Post } from "routing-controllers";
import { Service } from 'typedi';
import { RegisterDTO } from '../types/register-dto';
import { NewPasswordDTO } from '../types/new-password-dto';
import { ApiResponseMessage } from '../constants/api-response-message';
import { UserDTO } from '../types/user-dto';

@JsonController()
@Service()
export class Usercontroller {

  constructor(private userService: UserService) {}

  @Post('/register')
  public async register(@Body() body: RegisterDTO): Promise<ApiResponseMessage> {
    return await this.userService.register(body);
  }

  @Post('/login')
  public async login(@Body() body: LoginDTO): Promise<ApiResponseMessage | { token: string }> {
    return await this.userService.login(body);
  }

  @Post('/reset-password')
  public async resetPassword(@Body() body: { email: string }): Promise<ApiResponseMessage> {
    return await this.userService.resetPassword(body.email);
  }

  @Post('/new-password')
  public async addNewPassword(@Body() body: NewPasswordDTO): Promise<ApiResponseMessage> {
    return await this.userService.addNewPassword(body);
  }

  @Post('/check-pass-token')
  public async checkPassToken(@Body() body: { hash: string }): Promise<ApiResponseMessage> {
    return await this.userService.checkPassToken(body.hash);
  }

  @Get('/confirm-email/:hash')
  public async confirmEmail(@Param('hash') hash: string): Promise<ApiResponseMessage> {
    return await this.userService.confirmEmail(hash);
  }

  @Post('/api/change-pass')
  public async changePassword(
    @Body() body: ChangePasswordDTO,
    @HeaderParam('authorization') authorization: string
  ): Promise<ApiResponseMessage | { token: string }> {
    return await this.userService.changePassword(this.getToken(authorization), body);
  }

  @Post('/api/get-user')
  public async getUser(@HeaderParam('authorization') authorization: string): Promise<UserDTO | ApiResponseMessage> {
    return await this.userService.getUser(this.getToken(authorization));
  }

  private getToken(authorization: string): string {
    return authorization.slice(7);
  }
}
