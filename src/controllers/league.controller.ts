import {Body, HeaderParam, JsonController, Post} from "routing-controllers";
import { Service } from 'typedi';
import { ApiResponseMessage } from '../constants/api-response-message';
import { CreateLeagueDTO } from "../types/create-league.dto";
import { Utils } from "../utils";
import { LeagueService } from "../services/league.service";
import { SendInvitationDto } from "../types/send-invitation.dto";
import { LeagueDataDto } from "../types/league-data.dto";
import { LeagueDto } from "../types/league.dto";
import { BetDto } from "../types/bet.dto";
import { FinalWinnerDto } from "../types/final-winner.dto";
import { ModifyLeagueDto } from "../types/modify-league.dto";

@JsonController('/api')
@Service()
export class LeagueController {

  constructor(private leagueService: LeagueService) {}

  @Post('/league')
  public async createLeague(
    @HeaderParam('authorization') authorization: string,
    @Body() body: CreateLeagueDTO
  ): Promise<{ token: string } | ApiResponseMessage> {
    return await this.leagueService.createLeague(Utils.getUserFromToken(authorization), body);
  }

  @Post('/league/invite')
  public async sendInvitation(
    @HeaderParam('authorization') authorization: string,
    @Body() body: SendInvitationDto
  ): Promise<ApiResponseMessage> {
    return await this.leagueService.sendInvitation(Utils.getUserFromToken(authorization), body);
  }

  @Post('/accept-league-invitation')
  public async acceptInvitation(
    @HeaderParam('authorization') authorization: string,
    @Body() body: { leagueId: string }
  ): Promise<{ token: string } | ApiResponseMessage> {
    return await this.leagueService.acceptInvitation(Utils.getUserFromToken(authorization), body.leagueId);
  }

  @Post('/get-leagues')
  public async getLeaguesData(@Body() body: { leagueIds: string[] }): Promise<LeagueDataDto[]> {
    return await this.leagueService.getLeaguesData(body.leagueIds);
  }

  @Post('/get-league')
  public async getLeague(
    @HeaderParam('authorization') authorization: string,
    @Body() body: { leagueId: string }
  ): Promise<LeagueDto | ApiResponseMessage> {
    return await this.leagueService.getLeague(Utils.getUserFromToken(authorization), body.leagueId);
  }

  @Post('/league/save-week-bets')
  public async saveWeekBets(
    @HeaderParam('authorization') authorization: string,
    @Body() body: BetDto
  ): Promise<LeagueDto | ApiResponseMessage> {
    return await this.leagueService.saveWeekBets(Utils.getUserFromToken(authorization), body);
  }

  @Post('/league/save-final-winner')
  public async saveFinalWinner(
    @HeaderParam('authorization') authorization: string,
    @Body() body: FinalWinnerDto
  ): Promise<LeagueDto | ApiResponseMessage> {
    return await this.leagueService.saveFinalWinner(Utils.getUserFromToken(authorization), body);
  }

  @Post('/league/evaluate')
  public async evaluate(
    @HeaderParam('authorization') authorization: string
  ): Promise<ApiResponseMessage> {
    return await this.leagueService.evaluate(Utils.getUserFromToken(authorization));
  }

  @Post('/league/create-new-season')
  public async createNewSeason(
    @HeaderParam('authorization') authorization: string
  ): Promise<LeagueDto | ApiResponseMessage> {
    return await this.leagueService.createNewSeason(Utils.getUserFromToken(authorization).isAdmin);
  }

  @Post('/league/modify-league')
  public async modifyLeague(
    @HeaderParam('authorization') authorization: string,
    @Body() body: ModifyLeagueDto
  ): Promise<LeagueDto | ApiResponseMessage> {
    return await this.leagueService.modifyLeague(Utils.getUserFromToken(authorization).id, body);
  }
}
