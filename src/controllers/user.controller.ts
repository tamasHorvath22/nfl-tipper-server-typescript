import { UserService } from '../services/user.service';
import { Body, HeaderParam, JsonController, Post } from "routing-controllers";
import { Service } from 'typedi';
import { ApiResponseMessage } from '../constants/api-response-message';
import { Utils } from "../utils";
import { GoogleAuthDto } from "../types/google-auth.dto";

@JsonController()
@Service()
export class UserController {

  constructor(private userService: UserService) {}

  @Post('/google-auth')
  public async googleAuth(@Body() body: GoogleAuthDto): Promise<{ token: string }> {
    return await this.userService.googleAuth(body);
  }

  @Post('/api/user/change')
  public async changeUserData(
    @HeaderParam('authorization') authorization: string,
    @Body() body: { avatarUrl: string, name: string }
  ): Promise<{ token: string } | ApiResponseMessage> {
    return await this.userService.changeUserData(Utils.getUserFromToken(authorization), body);
  }

  @Post('/api/user/refresh')
  public async refreshUserToken(
    @HeaderParam('authorization') authorization: string
  ): Promise<{ token: string } | ApiResponseMessage> {
    return await this.userService.refreshUserData(Utils.getUserFromToken(authorization));
  }
}
