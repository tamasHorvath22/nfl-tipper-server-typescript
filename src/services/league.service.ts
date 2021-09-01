import { Service } from "typedi";
import { ApiResponseMessage } from '../constants/api-response-message';
import { TokenUser } from "../types/token-user";
import { CreateLeagueDTO } from "../types/create-league.dto";
import { UserRepositoryService } from "../repositories/user.repository";
import { WeekTrackerRepository } from "../repositories/week-tracker.repository";
import { UserDocument } from "../documents/user.document";
import LeagueModel from '../mongoose-models/league.model';
import SeasonModel from '../mongoose-models/season.model';
import { LeagueRepositoryService } from "../repositories/league.repository";
import { LeagueDocument } from "../documents/league.document";
import { DataService } from "./data.service";
import { WeekTrackerDocument } from "../documents/week-tracker.document";
import WeekModel from '../mongoose-models/week.model';
import GameModel from '../mongoose-models/game.model';
import { WeekType } from "../constants/week-type";
import {GameStatus} from "../constants/game-status";
import {Utils} from "../utils";
import {UserDTO} from "../types/user-dto";
import {SendInvitationDto} from "../types/send-invitation.dto";
import {LeagueDataDto} from "../types/league-data.dto";

@Service()
export class LeagueService {

	constructor(
		private userRepositoryService: UserRepositoryService,
		private weekTrackerRepository: WeekTrackerRepository,
		private leagueRepository: LeagueRepositoryService,
		private dataService: DataService
	) {}

	public async createLeague(
		tokenUser: TokenUser,
		leagueData: CreateLeagueDTO
	): Promise<UserDTO | ApiResponseMessage>{
		if (!leagueData?.name) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		const user = await this.userRepositoryService.getUserById(tokenUser.userId);
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!user || !weekTracker) {
			return ApiResponseMessage.NOT_FOUND;
		}

		const league = this.createLeagueDocument(user, leagueData, weekTracker.year);
		user.leagues.push({ leagueId: league._id, name: league.name });
		await this.createNewWeekForLeagues([league], weekTracker);

		let isLeagueSaveSuccess = await this.leagueRepository.saveLeagueAndUser(user, league);
		if (!isLeagueSaveSuccess) {
			return ApiResponseMessage.CREATE_FAIL;
		}
		return Utils.mapToUserDto(user);
	}

	public async sendInvitation(tokenUser: TokenUser, inviteData: SendInvitationDto) {
		const league = await this.leagueRepository.getLeagueById(inviteData.leagueId);
		if (!league) {
			return ApiResponseMessage.LEAGUES_NOT_FOUND;
		}

		if (tokenUser.userId !== league.creator) {
			return ApiResponseMessage.NO_INVITATION_RIGHT;
		}

		const invitedUser = await this.userRepositoryService.getByEmail(inviteData.invitedEmail);
		if (!invitedUser) {
			return ApiResponseMessage.NO_EMAIL_FOUND;
		}

		if (league.players.find(user => user.id.toString() === invitedUser._id.toString())) {
			return ApiResponseMessage.USER_ALREADY_IN_LEAGUE;
		}

		if (
			league.invitations.includes(invitedUser._id.toString()) ||
			invitedUser.invitations.find(invite => invite.leagueId.toString() === league._id.toString())
		) {
			return ApiResponseMessage.USER_ALREADY_INVITED;
		}

		league.invitations.push(invitedUser._id);
		invitedUser.invitations.push({ leagueId: league._id, name: league.name });
		const isSaveSuccess = await this.leagueRepository.saveLeagueAndUser(invitedUser, league);
		return isSaveSuccess ? ApiResponseMessage.INVITATION_SUCCESS : ApiResponseMessage.INVITATION_FAIL;
	}

	public async acceptInvitation(tokenUser: TokenUser, leagueId: string): Promise<UserDTO | ApiResponseMessage> {
		const league = await this.leagueRepository.getLeagueById(leagueId);
		if (!league) {
			return ApiResponseMessage.LEAGUES_NOT_FOUND;
		}

		const user = await this.userRepositoryService.getUserById(tokenUser.userId);
		if (!user) {
			return ApiResponseMessage.NOT_FOUND;
		}

		if (!league.invitations.includes(user._id.toString())) {
			return ApiResponseMessage.USER_NOT_INVITED;
		}

		// remove invitation from user
		user.invitations.splice(user.invitations.findIndex(elem => elem.leagueId.toString() === league._id.toString()), 1);
		// add league to user's league
		user.leagues.push({ leagueId: league._id, name: league.name });
		// remove invitation from league
		league.invitations.splice(league.invitations.indexOf(user._id));
		// add player to league
		league.players.push({ id: user._id, name: user.username, avatar: user.avatarUrl });
		const currentSeason = league.seasons.find(season => season.isOpen);
		// user added to season final winner object
		currentSeason.finalWinner[user._id.toString()] = null;
		// add user to season standings
		currentSeason.standings.push({ id: user._id.toString(), name: user.username, score: 0 })
		if (currentSeason.weeks.length) {
			const currentWeek = currentSeason.weeks.find(week => week.isOpen);
			// add user to current week bets
			currentWeek.games.forEach(game => {
				game.bets.push({ id: user._id, name: user.username, bet: null });
			})
		}
		const isSaveSuccess = await this.leagueRepository.saveLeagueAndUser(user, league);
		return isSaveSuccess ? Utils.mapToUserDto(user) : ApiResponseMessage.JOIN_FAIL;
	}

	public async getLeaguesData(leagueIds: string[]): Promise<LeagueDataDto[]> {
		return await this.leagueRepository.getLeaguesData(leagueIds);
	}

	private createLeagueDocument(user: UserDocument, leagueData: CreateLeagueDTO, year: number) {
		return new LeagueModel({
			name: leagueData.name,
			creator: user._id,
			invitations: [],
			players: [{ id: user._id, name: user.username, avatar: user.avatarUrl }],
			seasons: [
				new SeasonModel({
					year: year,
					numberOfSeason: year - 1919,
					numberOfSuperBowl: year - 1965,
					weeks: [],
					standings: [{ id: user._id, name: user.username, score: 0 }],
					finalWinner: {
						[user._id.toString()]: null
					},
					isOpen: true
				})
			],
			leagueAvatarUrl: leagueData.leagueAvatarUrl || null
		});
	}

	private async createNewWeekForLeagues(leagues: LeagueDocument[], weekTracker: WeekTrackerDocument): Promise<void> {
		const weekData = await this.dataService.getWeekData(weekTracker);

		for (const league of leagues) {
			const currentSeason = league.seasons.find(season => season.year === weekData.year);
			if (currentSeason.weeks.find(week => week.weekId === weekData.week.id)) {
				return;
			}
			currentSeason.weeks.push(this.createNewWeekModel(weekData, league));
		}
	}

	private createNewWeekModel(weekData: any, league: LeagueDocument) {
		const weekNum = weekData.type === WeekType.POSTSEASON ? 18 + weekData.week.sequence : weekData.week.sequence
		let week = new WeekModel({
			weekId: weekData.week.id,
			number: weekNum,
			isOpen: true,
			games: []
		})

		for (const gameData of weekData.week.games) {
			const newGame = new GameModel({
				gameId: gameData.id,
				homeTeam: gameData.home.name,
				homeTeamAlias: gameData.home.alias,
				awayTeam: gameData.away.name,
				awayTeamAlias: gameData.away.alias,
				status: GameStatus.SCHEDULED,
				homeScore: null,
				awayScore: null,
				startTime: gameData.scheduled,
				isOpen: true,
				winner: null,
				winnerTeamAlias: null,
				winnerValue: null,
				bets: []
			});

			for (const player of league.players) {
				newGame.bets.push({ id: player.id, name: player.name, bet: null })
			}
			week.games.push(newGame);
		}
		return week;
	}

}
