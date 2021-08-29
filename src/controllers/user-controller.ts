import { LoginDTO } from './../types/login-dto';
import { UserService } from './../services/user.service';
import { Body, JsonController, Post } from "routing-controllers";
import { Service } from 'typedi';
import { RegisterDTO } from '../types/register-dto';

@JsonController()
@Service()
export class Usercontroller {

  constructor(private userService: UserService) {}

  @Post('/register')
  public async register(@Body() body: RegisterDTO): Promise<any> {
    return await this.userService.register(body);
  }

  @Post('/login')
  public async login(@Body() body: LoginDTO): Promise<any> {
    return await this.userService.login(body);
  }

  @Post('/reset-password')
  public async resetPassword(@Body() body: { email: string }): Promise<any> {
    return await this.userService.resetPassword(body.email);
  }
}
