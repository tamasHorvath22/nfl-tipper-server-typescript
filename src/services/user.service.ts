import { UserRepositoryService } from './../repositories/user.repository';
import { UserDocument } from './../documents/user.document';
import { RegisterDTO } from './../types/register-dto';
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
import jwtDecode from 'jwt-decode';
import { TokenUser } from '../types/token-user';
import { ChangePasswordDTO } from '../types/change-password.dto';
import { UserDTO } from '../types/user-dto';


@Service()
export class UserService {

  constructor(
    private userRepositoryService: UserRepositoryService,
    private mailService: MailService
  ) {}

  public async register(registerDto: RegisterDTO): Promise<ApiResponseMessage> {
    if (registerDto.username[0] === '$') {
      return ApiResponseMessage.USERNAME_STARTS_WITH_$;
    }
    const user = new UserModel({
      username: registerDto.username,
      // TODO password hash
      password: registerDto.password, // this.decryptPassword(registerDto.password),
      email: registerDto.email,
      leagues: [],
      invitations: [],
      avatarUrl: null,
      isEmailConfirmed: false,
      isAdmin: false
    });

    const emailConfirm = new EmailConfirmModel({
      email: registerDto.email,
      userId: user._id
    })

    const userSaveResponse = await this.userRepositoryService.saveUser(user, emailConfirm);
    if (userSaveResponse !== ApiResponseMessage.SUCCESSFUL_REGISTRATION) {
      return userSaveResponse;
    }

    const userEmailData: RegisterMail = {
      $emailAddress: user.email,
      $username: user.username,
      $url: `${ConfigService.getConfirmEmailUrl}/${emailConfirm._id}`
    }

    await this.mailService.send(userEmailData, MailType.REGISTRATION);

    return ApiResponseMessage.SUCCESSFUL_REGISTRATION;
  }

  public async login(loginDTO: LoginDTO): Promise<ApiResponseMessage | { token: string }> {
    const user = await this.userRepositoryService.getUserByUsername(loginDTO.username);
    if (!user) {
      return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
    }
    if (!user) {
      return ApiResponseMessage.DATABASE_ERROR;
    } else {
      user === user as UserDocument;
    }
  
    if (!user.isEmailConfirmed) {
      return ApiResponseMessage.EMAIL_NOT_CONFIRMED;
    }
    let authenticated;
    try {
      // TODO password hash
      // authenticated = await bcrypt.compare(this.decryptPassword(loginDTO.password), user.password);
      authenticated = await bcrypt.compare(loginDTO.password, user.password);
    } catch (err) {
      console.error(err);
      return ApiResponseMessage.AUTHENTICATION_ERROR;
    }
    if (authenticated) {
      try {
        return { token: jwt.sign(this.mapUserToToken(user), ConfigService.getEnvValue('JWT_PRIVATE_KEY')) };
      } catch (err) {
        console.error(err);
        return ApiResponseMessage.TOKEN_CREATE_ERROR;
      }
    } else {
      return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
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
        $url: `${process.env.UI_BASE_URL}${process.env.RESET_PASSWORD_URL}/${forgotPassword._id}`
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
    // user.password = this.decryptPassword(data.password);
    user.password = newPasswordDTO.password;
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

  public async changePassword(token: string, passwords: ChangePasswordDTO) {
    const decodedToken: TokenUser = jwtDecode(token);
    const user = await this.userRepositoryService.getUserByUsername(decodedToken.username);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    let authenticated;
    try {
      authenticated = await bcrypt.compare(
        passwords.oldPassword,
        // TODO
        // this.decryptPassword(passwords.oldPassword),
        user.password
      );
    } catch (err) {
      console.error(err);
      return ApiResponseMessage.AUTHENTICATION_ERROR;
    }
    if (authenticated) {
      // TODO
      // user.password = this.decryptPassword(passwords.newPassword)
      user.password = passwords.newPassword;
      const userSaveResult = await this.userRepositoryService.changePassword(user);
      if (userSaveResult) {
        try {
          return { token: jwt.sign(this.mapUserToToken(user), ConfigService.getEnvValue('JWT_PRIVATE_KEY')) };
        } catch (err) {
          console.error(err);
          return ApiResponseMessage.TOKEN_CREATE_ERROR;
        }
      }
      return ApiResponseMessage.RESET_PASSWORD_FAIL;
    } else {
      return ApiResponseMessage.WRONG_USERNAME_OR_PASSWORD;
    }
  }

  public async getUser(token: string): Promise<UserDTO | ApiResponseMessage> {
    const decodedToken: TokenUser = jwtDecode(token);
    const user = await this.userRepositoryService.getUserByUsername(decodedToken.username);
    if (!user) {
      return ApiResponseMessage.NOT_FOUND;
    }
    return this.mapToUserDto(user);
  }

  private decryptPassword(hash: string): string {
    const bytes = CryptoJS.AES.decrypt(hash, ConfigService.getEnvValue('PASSWORD_SECRET_KEY'));
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private mapUserToToken(user: UserDocument): TokenUser {
    return {
      username: user.username,
      userId: user._id,
      userEmail: user.email,
      isAdmin: user.isAdmin
    }
  }

  private mapToUserDto(user: UserDocument): UserDTO {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isEmailConfirmed: user.isEmailConfirmed,
      isAdmin: user.isAdmin,
      leagues: user.leagues,
      invitations: user.invitations
    }
  }
  
}
