import { Body, HeaderParam, JsonController, Post } from "routing-controllers";
import { Service } from 'typedi';
import { ApiResponseMessage } from '../constants/api-response-message';
import { CreateLeagueDTO } from "../types/create-league.dto";
import { Utils } from "../utils";
import { LeagueService } from "../services/league.service";
import { SendInvitationDto } from "../types/send-invitation.dto";
import { LeagueDataDto } from "../types/league-data.dto";
import { LeagueDto } from "../types/league.dto";

@JsonController('/api')
@Service()
export class LeagueController {

  constructor(private leagueService: LeagueService) {}

  @Post('/league')
  public async register(
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
}
