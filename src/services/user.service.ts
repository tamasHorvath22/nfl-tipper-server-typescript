import {LeagueRepositoryService} from '../repositories/league.repository';
import {UserRepositoryService} from '../repositories/user.repository';
import {Service} from 'typedi';
import {ApiResponseMessage} from '../constants/api-response-message';
import UserModel from '../mongoose-models/user.model';
import {UserDTO} from '../types/user-dto';
import {Utils} from '../utils';
import {GoogleAuthDto} from '../types/google-auth.dto';

@Service()
export class UserService {

  constructor(
    private userRepositoryService: UserRepositoryService,
    private leagueRepositoryService: LeagueRepositoryService
  ) {}

  public async googleAuth(googleAuthDto: GoogleAuthDto): Promise<{ token: string }> {
    const user = await this.userRepositoryService.getUserByNickname(googleAuthDto.nickname);
    if (user === undefined) {
      const newGoogleUser = new UserModel({
        username: googleAuthDto.username,
        nickname: googleAuthDto.nickname,
        password: `${Math.floor(Math.random() * 9999999)}`,
        email: googleAuthDto.email,
        leagues: [],
        invitations: [],
        avatarUrl: null,
        isEmailConfirmed: true,
        isAdmin: false
      });

      const savedUser = await this.userRepositoryService.saveGoogleUser(newGoogleUser);
      if (savedUser) {
        return Utils.signToken(savedUser);
      }
    } else if (user === null) {
      // TODO error handling
    }
    return Utils.signToken(user);
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
        league.players.find(player => player.id === user._id.toString()).avatar = user.avatarUrl;
      }
    }
    const result = await this.leagueRepositoryService.changeUserData(user, leagues);
    if (!result) {
      return ApiResponseMessage.MODIFY_FAIL;
    }
    return Utils.signToken(result);
  }
}
