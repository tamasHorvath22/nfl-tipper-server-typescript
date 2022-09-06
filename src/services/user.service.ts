import { LeagueRepositoryService } from '../repositories/league.repository';
import { UserRepositoryService } from '../repositories/user.repository';
import { Service } from 'typedi';
import { ApiResponseMessage } from '../constants/api-response-message';
import UserModel from '../mongoose-models/user.model';
import { UserDTO } from '../types/user-dto';
import { Utils } from '../utils';
import { GoogleAuthDto } from '../types/google-auth.dto';
import { HttpError } from 'routing-controllers';
import * as CryptoJS from 'crypto-js';
import { ConfigService, EnvKey } from './config.service';
import { LeagueDocument } from '../documents/league.document';

@Service()
export class UserService {

  private readonly serverErrorCode = 500;

  constructor(
    private userRepositoryService: UserRepositoryService,
    private leagueRepositoryService: LeagueRepositoryService
  ) {}

  public async googleAuth(googleAuthDto: GoogleAuthDto): Promise<{ token: string }> {
    const userEmail = this.decrypt(googleAuthDto.email);
    let user = await this.userRepositoryService.getByEmail(userEmail);
    if (user === null) {
      throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
    }

    if (user === undefined) {
      const newGoogleUser = new UserModel({
        username: this.decrypt(googleAuthDto.username),
        nickname: this.decrypt(googleAuthDto.nickname),
        password: `${Math.floor(Math.random() * 9999999)}`,
        email: userEmail,
        leagues: [],
        invitations: [],
        avatarUrl: null,
        isEmailConfirmed: true,
        isAdmin: false
      });

      user = await this.userRepositoryService.saveGoogleUser(newGoogleUser);
      if (!user) {
        throw new HttpError(this.serverErrorCode, ApiResponseMessage.USER_CREATE_ERROR);
      }
    }
    return Utils.signToken(user);
  }

  public async refreshUserData(tokenUser: UserDTO): Promise<{ token: string }> {
    const user = await this.userRepositoryService.getUserById(tokenUser.id);
    if (!user) {
      throw new HttpError(this.serverErrorCode, ApiResponseMessage.NOT_FOUND);
    }
    return Utils.signToken(user);
  }

  public async changeUserData(tokenUser: UserDTO, body: { avatarUrl: string, name: string }): Promise<{ token: string }> {
    if (!body.name) {
      throw new HttpError(this.serverErrorCode, ApiResponseMessage.MISSING_USERNAME);
    }
    const user = await this.userRepositoryService.getUserById(tokenUser.id);
    if (!user) {
      throw new HttpError(this.serverErrorCode, ApiResponseMessage.NOT_FOUND);
    }

    user.avatarUrl = body.avatarUrl;
    user.username = body.name;
    let leagues: LeagueDocument[];
    if (user.leagues.length) {
      leagues = await this.leagueRepositoryService.getLeaguesByIds(user.leagues.map(league => league.leagueId));
      if (!leagues) {
        throw new HttpError(this.serverErrorCode, ApiResponseMessage.LEAGUES_NOT_FOUND);
      }
      for (const league of leagues) {
        const player = league.players.find(player => player.id.toString() === user._id.toString());
        if (!player) {
          continue;
        }
        player.avatar = user.avatarUrl;
        player.name = user.username;
      }
    }
    const result = await this.leagueRepositoryService.changeUserData(user, leagues);
    if (!result) {
      throw new HttpError(this.serverErrorCode, ApiResponseMessage.MODIFY_FAIL);
    }
    return Utils.signToken(result);
  }

  private decrypt(source: string): string {
    const bytes = CryptoJS.AES.decrypt(source, ConfigService.getEnvValue(EnvKey.API_PRIVATE_KEY));
    return bytes.toString() ? bytes.toString(CryptoJS.enc.Utf8) : null;
  }
}
