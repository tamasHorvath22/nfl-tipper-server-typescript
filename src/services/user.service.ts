import { LeagueRepositoryService } from '../repositories/league.repository';
import { UserRepositoryService } from '../repositories/user.repository';
import { RegisterDTO } from '../types/register-dto';
import { Service } from "typedi";
import { ApiResponseMessage } from '../constants/api-response-message';
import UserModel from '../mongoose-models/user.model';
import EmailConfirmModel from '../mongoose-models/email-confirm.model';
import CryptoJS from 'crypto-js';
import { ConfigService } from './config.service';
import { RegisterMail } from '../types/register-mail';
import { MailService } from './mail.service';
import { MailType } from '../constants/mail-types';
import { LoginDTO } from '../types/login-dto';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ForgotPasswordModel from '../mongoose-models/forgot-password.model';
import { NewPasswordDTO } from '../types/new-password-dto';
import { ChangePasswordDTO } from '../types/change-password.dto';
import { UserDTO } from '../types/user-dto';
import { Utils } from "../utils";


@Service()
export class UserService {

  constructor(
    private userRepositoryService: UserRepositoryService,
    private leagueRepositoryService: LeagueRepositoryService,
    private mailService: MailService
  ) {}

  public async register(registerDto: RegisterDTO): Promise<ApiResponseMessage> {
    if (registerDto.username[0] === '$') {
      return ApiResponseMessage.USERNAME_STARTS_WITH_$;
    }
    const user = new UserModel({
      username: registerDto.username,
      // TODO password hash
      password: this.decryptPassword(registerDto.password),
      // password: registerDto.password,
      email: registerDto.email,
      leagues: [],
      invitations: [],
      avatarUrl: null,
      isEmailConfirmed: false,
      isAdmin: false
    });

    const emailConfirm = new EmailConfirmModel({
      email: registerDto.email,
      userId: user._id.toString()
    })

    const userSaveResponse = await this.userRepositoryService.saveUser(user, emailConfirm);
    if (userSaveResponse !== ApiResponseMessage.SUCCESSFUL_REGISTRATION) {
      return userSaveResponse;
    }

    const userEmailData: RegisterMail = {
      $emailAddress: user.email,
      $username: user.username,
      $url: `${ConfigService.getConfirmEmailUrl}/${emailConfirm._id.toString()}`
    }

    await this.mailService.send(userEmailData, MailType.REGISTRATION);

    return ApiResponseMessage.SUCCESSFUL_REGISTRATION;
  }

  public async login(loginDTO: LoginDTO): Promise<ApiResponseMessage | { token: string }> {
    const user = await this.userRepositoryService.getUserByUsername(loginDTO.username);
    if (!user) {
      return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
    }
    if (!user.isEmailConfirmed) {
      return ApiResponseMessage.EMAIL_NOT_CONFIRMED;
    }
    try {
      // TODO password hash
      const authenticated = await bcrypt.compare(this.decryptPassword(loginDTO.password), user.password);
      if (authenticated) {
        return Utils.signToken(user);
      } else {
        return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
      }
    } catch (err) {
      console.error(err);
      return ApiResponseMessage.AUTHENTICATION_ERROR;
    }
  }

  public async resetPassword(email: string) {
    const user = await this.userRepositoryService.getByEmail(email);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    const forgotPassword = new ForgotPasswordModel({
      email: email
    });
    const isResetPasswordSuccess = await this.userRepositoryService.createPasswordReset(forgotPassword);
    if (isResetPasswordSuccess) {
      const userEmailData = {
        $emailAddress: email,
        $username: user.username,
        $url: `${process.env.UI_BASE_URL}${process.env.RESET_PASSWORD_URL}/${forgotPassword._id.toString()}`
      }
      await this.mailService.send(userEmailData, MailType.FORGOT_PASSWORD);
      return ApiResponseMessage.RESET_PASSWORD_EMAIL_SENT;
    } else {
      return ApiResponseMessage.RESET_PASSWORD_EMAIL_FAIL;
    }
  }

  public async addNewPassword(newPasswordDTO: NewPasswordDTO): Promise<ApiResponseMessage> {
    if (!newPasswordDTO) {
      return ApiResponseMessage.ERROR;
    }
    const forgotPassword = await this.userRepositoryService.getForgotPasswordById(newPasswordDTO.hash);
    if (!forgotPassword) {
      return ApiResponseMessage.ERROR;
    }
    const user = await this.userRepositoryService.getByEmail(forgotPassword.email);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
  
    // TODO
    user.password = this.decryptPassword(newPasswordDTO.password);
    // user.password = newPasswordDTO.password;
    return await this.userRepositoryService.createNewPassword(user, forgotPassword);
  }
  
  public async checkPassToken(hash: string): Promise<ApiResponseMessage> {
    const forgotPassword = await this.userRepositoryService.getForgotPasswordById(hash);
    if (!forgotPassword) {
      return ApiResponseMessage.NO_HASH_FOUND;
    }
    return ApiResponseMessage.HASH_FOUND;
  }

  public async confirmEmail(hash: string): Promise<ApiResponseMessage> {
    const emailConfirm = await this.userRepositoryService.getEmailConfirmById(hash);
    if (!emailConfirm) {
      return ApiResponseMessage.NO_EMAIL_HASH_FOUND;
    }
    const user = await this.userRepositoryService.getUserById(emailConfirm.userId);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    user.isEmailConfirmed = true;
    const result = await this.userRepositoryService.confirmEmail(user, emailConfirm);
    return result ? ApiResponseMessage.EMAIL_CONFIRMED : ApiResponseMessage.EMAIL_CONFIRM_FAIL;
  }

  public async changePassword(tokenUser: UserDTO, passwords: ChangePasswordDTO) {
    const user = await this.userRepositoryService.getUserByUsername(tokenUser.username);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    try {
      const authenticated = await bcrypt.compare(
        // passwords.oldPassword,
        // TODO
        this.decryptPassword(passwords.oldPassword),
        user.password
      );
      if (authenticated) {
        // TODO
        user.password = this.decryptPassword(passwords.newPassword)
        // user.password = passwords.newPassword;
        const userSaveResult = await this.userRepositoryService.changePassword(user);
        if (userSaveResult) {
          return { token: jwt.sign(Utils.mapToUserDto(user), ConfigService.getEnvValue('JWT_PRIVATE_KEY')) };
        } else {
          return ApiResponseMessage.TOKEN_CREATE_ERROR;
        }
      } else {
        return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
      }
    } catch (err) {
      console.error(err);
      return ApiResponseMessage.AUTHENTICATION_ERROR;
    }
  }

  public async changeUserData(tokenUser: UserDTO, avatarUrl: string): Promise<ApiResponseMessage | { token: string }> {
    const user = await this.userRepositoryService.getUserById(tokenUser.id);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    
    user.avatarUrl = avatarUrl;
    let leagues;
    if (user.leagues.length) {
      leagues = await this.leagueRepositoryService.getLeaguesByIds(user.leagues.map(league => league.leagueId));
      if (!leagues) {
        return ApiResponseMessage.LEAGUES_NOT_FOUND;
      }
      for (const league of leagues) {
        league.players.find(player => user._id.toString() === player.id).avatar = user.avatarUrl;
      }
    }
    const result = await this.leagueRepositoryService.changeUserData(user, leagues);
    if (!result) {
      return ApiResponseMessage.MODIFY_FAIL;
    }
    return Utils.signToken(result);
  }

  private decryptPassword(hash: string): string {
    const bytes = CryptoJS.AES.decrypt(hash, ConfigService.getEnvValue('PASSWORD_SECRET_KEY'));
    return bytes.toString(CryptoJS.enc.Utf8);
  }

}
