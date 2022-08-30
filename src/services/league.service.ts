import { Service } from 'typedi';
import { ApiResponseMessage } from '../constants/api-response-message';
import { CreateLeagueDTO } from '../types/create-league.dto';
import { UserRepositoryService } from '../repositories/user.repository';
import { WeekTrackerRepository } from '../repositories/week-tracker.repository';
import { UserDocument } from '../documents/user.document';
import LeagueModel from '../mongoose-models/league.model';
import SeasonModel from '../mongoose-models/season.model';
import { LeagueRepositoryService } from '../repositories/league.repository';
import { GameDocument, LeagueDocument, SeasonDocument } from '../documents/league.document';
import { DataService } from './data.service';
import { WeekTrackerDocument } from '../documents/week-tracker.document';
import WeekModel from '../mongoose-models/week.model';
import GameModel from '../mongoose-models/game.model';
import { WeekType } from '../constants/week-type';
import { GameStatus } from '../constants/game-status';
import { Utils } from '../utils';
import { SendInvitationDto } from '../types/send-invitation.dto';
import { LeagueDataDto } from '../types/league-data.dto';
import { LeagueDto } from '../types/league.dto';
import { UserDTO } from '../types/user-dto';
import { BetDto } from '../types/bet.dto';
import { FinalWinnerDto } from '../types/final-winner.dto';
import { BetType } from '../constants/bet-types';
import { GameOutcome } from '../constants/game-outcome';
import { ModifyLeagueDto } from '../types/modify-league.dto';
import { HttpError } from 'routing-controllers';

@Service()
export class LeagueService {

	readonly serverErrorCode = 500;

	constructor(
		private userRepositoryService: UserRepositoryService,
		private weekTrackerRepository: WeekTrackerRepository,
		private leagueRepository: LeagueRepositoryService,
		private dataService: DataService
	) {}

	public async createLeague(
		tokenUser: UserDTO,
		leagueData: CreateLeagueDTO
	): Promise<{ token: string }>{
		if (!leagueData?.name) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		const user = await this.userRepositoryService.getUserById(tokenUser.id);
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!user || !weekTracker) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		const league = this.createLeagueDocument(user, leagueData, weekTracker.year);
		user.leagues.push({ leagueId: league._id.toString(), name: league.name });
		await this.createNewWeekForLeagues([league], weekTracker);

		let isLeagueSaveSuccess = await this.leagueRepository.saveLeagueAndUser(user, league);
		if (!isLeagueSaveSuccess) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		return Utils.signToken(user);
	}

	public async sendInvitation(tokenUser: UserDTO, inviteData: SendInvitationDto): Promise<ApiResponseMessage> {
		const league = await this.leagueRepository.getLeagueById(inviteData.leagueId);
		if (!league) {
			return ApiResponseMessage.LEAGUES_NOT_FOUND;
		}

		if (tokenUser.id !== league.creator) {
			return ApiResponseMessage.NO_INVITATION_RIGHT;
		}

		const invitedUser = await this.userRepositoryService.getByEmail(inviteData.email);
		if (!invitedUser) {
			return ApiResponseMessage.NO_EMAIL_FOUND;
		}

		const userId = invitedUser._id.toString();
		if (league.players.find(user => user.id.toString() === userId)) {
			return ApiResponseMessage.USER_ALREADY_IN_LEAGUE;
		}

		const leagueId = league._id.toString();
		if (
			league.invitations.includes(userId) ||
			invitedUser.invitations.find(invite => invite.leagueId === leagueId)
		) {
			return ApiResponseMessage.USER_ALREADY_INVITED;
		}

		league.invitations.push(userId);
		invitedUser.invitations.push({ leagueId: leagueId, name: league.name });
		const isSaveSuccess = await this.leagueRepository.saveLeagueAndUser(invitedUser, league);
		return isSaveSuccess ? ApiResponseMessage.INVITATION_SUCCESS : ApiResponseMessage.INVITATION_FAIL;
	}

	public async acceptInvitation(tokenUser: UserDTO, leagueId: string): Promise<boolean> {
		const league = await this.leagueRepository.getLeagueById(leagueId);
		const user = await this.userRepositoryService.getUserById(tokenUser.id);
		if (!league || ! user) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		const userId = user._id.toString();
		if (!league.invitations.includes(userId)) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		// remove invitation from user
		user.invitations.splice(user.invitations.findIndex(elem => elem.leagueId.toString() === leagueId), 1);

		// add league to user's league
		user.leagues.push({ leagueId: leagueId, name: league.name });

		// remove invitation from league
		league.invitations.splice(league.invitations.indexOf(userId));

		// add player to league
		league.players.push({ id: userId, name: user.username, avatar: user.avatarUrl });
		const currentSeason = league.seasons.find(season => season.isOpen);

		// user added to season final winner object
		currentSeason.finalWinner[userId] = null;

		// add user to season standings
		currentSeason.standings.push({ id: userId, name: user.username, score: 0 })
		if (currentSeason.weeks.length) {
			const currentWeek = currentSeason.weeks.find(week => week.isOpen);
			// add user to current week bets
			currentWeek.games.forEach(game => {
				game.bets.push({ id: userId, name: user.username, bet: null });
			})
		}

		const isSaveSuccess = await this.leagueRepository.saveLeagueAndUser(user, league);
		if (!isSaveSuccess) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		return true;
	}

	public async getLeaguesData(tokenUser: UserDTO): Promise<LeagueDataDto[]> {
		const user = await this.userRepositoryService.getUserById(tokenUser.id);
		if (!user) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		const leagues = await this.leagueRepository.getLeaguesData(user.leagues.map(league => league.leagueId));
		if (!leagues) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		return leagues;
	}

	public async getLeague(tokenUser: UserDTO, leagueId: string): Promise<LeagueDto> {
		const league = await this.leagueRepository.getLeagueById(leagueId);
		if (!league) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.NOT_FOUND);
		}
		if (!league.players.some(player => player.id.toString() === tokenUser.id)) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!weekTracker) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		const currentSeason = league.seasons.find(season => season.isOpen);
		const currentWeek = currentSeason.weeks.find(week => week.isOpen);
		const startOfFirstGame = Math.min(...currentWeek.games.map(g => new Date(g.startTime).getTime()));

		const userId = tokenUser.id.toString();
		if (weekTracker.week === 1 && weekTracker.regOrPst === WeekType.REGULAR && new Date().getTime() < startOfFirstGame) {
			currentSeason.finalWinner = { [userId]: currentSeason.finalWinner[userId] };
		}

		const teamStandings = await this.getTeamStandingsData(weekTracker.year);
		await Utils.waitFor(1500);

		const now = new Date().getTime();
		for (const game of currentWeek.games) {
			if (new Date(game.startTime).getTime() < now) {
				continue;
			}
			game.bets = game.bets.filter(bet => bet.id.toString() === userId);
		}
		return Utils.mapToLeagueDto(league, teamStandings);
	}

	public async saveWeekBets(tokenUser: UserDTO, betDto: BetDto) {
		const user = await this.userRepositoryService.getUserById(tokenUser.id);
		if (!user) {
			return ApiResponseMessage.DATABASE_ERROR;
		}

		const leagueIdList = betDto.isForAllLeagues ? user.leagues.map(league => league.leagueId) : [betDto.leagueId];
		const leagues = await this.leagueRepository.getLeaguesByIds(leagueIdList);
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!leagues || !weekTracker) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		for (const league of leagues) {
			this.saveBetsForOneLeague(tokenUser.id, league, betDto, weekTracker.year);
		}
		const isSaveSuccess = await this.leagueRepository.updateLeagues(leagues);
		return isSaveSuccess ? ApiResponseMessage.BET_SAVE_SUCCESS : ApiResponseMessage.BET_SAVE_FAIL;
	}

	public async getTeamStandingsData(year: number): Promise<any> {
		const standings = {};
		const rawData = await this.dataService.getTeamStandingsData(year);
		if (!rawData) {
			return null;
		}

		for (const conference of rawData.data.conferences) {
			for (const division of conference.divisions) {
				for (const team of division.teams) {
					standings[team.alias] = {
						win: team.wins,
						loss: team.losses,
						tie: team.ties
					}
				}
			}
		}
		return standings;
	}

	public async saveFinalWinner(tokenUser: UserDTO, finalWinnerDto: FinalWinnerDto): Promise<LeagueDto> {
		const league = await this.leagueRepository.getLeagueById(finalWinnerDto.leagueId);
		if (!league) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.LEAGUES_NOT_FOUND);
		}
		if (!league.players.some(player => player.id.toString() === tokenUser.id)) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		const currentSeason = league.seasons.find(season => season.isOpen);
		currentSeason.finalWinner[tokenUser.id] = finalWinnerDto.finalWinner;

		const isSaveSuccess = await this.leagueRepository.updateLeagues([league]);
		if (!isSaveSuccess) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.UPDATE_FAIL);
		}
		return this.getLeague(tokenUser, finalWinnerDto.leagueId);
	}

	public async evaluate(tokenUser: UserDTO): Promise<ApiResponseMessage> {
		if (!tokenUser.isAdmin) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		const leagues = await this.leagueRepository.getAllLeagues();
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!leagues || !weekTracker) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		const weekResults = await this.dataService.getWeekData(weekTracker);
		if (!weekResults) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		const isThisSuperBowlWeek = this.isSuperBowlWeek(weekResults);
		let isWeekOver;

		for (const league of leagues) {
			const resultObject = {};
			for (const player of league.players) {
				resultObject[player.id.toString()] = 0;
			}

			const currentSeason = league.seasons.find(season => season.year === weekResults.year);
			const currWeek = currentSeason.weeks.find(week => week.weekId === weekResults.week.id);
			const evaluateWeekResults = this.evaluateWeek(currWeek.games, weekResults.week.games, resultObject);

			for (const standing of currentSeason.standings) {
				standing.score += evaluateWeekResults[standing.id.toString()];
			}

			isWeekOver = !currWeek.games.some(game => game.isOpen);
			if (isWeekOver) {
				currWeek.isOpen = false;
				if (isThisSuperBowlWeek) {
					this.checkFinalWinnerBets(currentSeason, this.getSuperbowlWinner(weekResults.week.games[0]));
				}
			}
		}

		if (!isWeekOver) {
			const isSaveSuccess = await this.leagueRepository.updateLeagues(leagues);
			if (!isSaveSuccess) {
				return ApiResponseMessage.DATABASE_ERROR;
			}
			return ApiResponseMessage.EVALUATION_SUCCESS;
		}

		await Utils.waitFor(1100);
		const freshWeekTracker = this.stepWeekTracker(weekTracker);

		if (isThisSuperBowlWeek) {
			return ApiResponseMessage.EVALUATION_SUCCESS;
		}

		const isCreateSuccess = await this.createNewWeekForLeagues(leagues, freshWeekTracker);
		if (!isCreateSuccess) {
			return ApiResponseMessage.DATABASE_ERROR;
		}

		const isSaveSuccess = await this.leagueRepository.saveLeaguesAndWeekTracker(leagues, freshWeekTracker);
		return isSaveSuccess ? ApiResponseMessage.EVALUATION_SUCCESS : ApiResponseMessage.DATABASE_ERROR;
	}

	public async createNewSeason(isAdmin: boolean): Promise<ApiResponseMessage> {
		if (!isAdmin) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!weekTracker || weekTracker.regOrPst === WeekType.REGULAR || weekTracker.week !== 4) {
			return ApiResponseMessage.DATABASE_ERROR;
		}

		const updatedWeekTracker = this.stepWeekTracker(weekTracker);

		const leagues = await this.leagueRepository.getAllLeagues();
		if (!leagues) {
			return ApiResponseMessage.DATABASE_ERROR;
		}
		for (const league of leagues) {
			if (league.seasons.find(season => season.year === updatedWeekTracker.year)) {
				continue;
			}
			const prevSeason = league.seasons.find(season => season.year === updatedWeekTracker.year - 1);
			if (prevSeason) {
				prevSeason.isOpen = false;
			}
			const finalWinnerObj = {};
			for (const player of league.players) {
				// @ts-ignore
				finalWinnerObj[player.id.toString()] = null;
			}

			const newSeason = new SeasonModel({
				year: updatedWeekTracker.year,
				numberOfSeason: updatedWeekTracker.year - 1919,
				numberOfSuperBowl: updatedWeekTracker.year - 1965,
				weeks: [],
				standings: league.players.map(player => {
					return { id: player.id.toString(), name: player.name, score: 0 }
				}),
				finalWinner: finalWinnerObj,
				isOpen: true
			});
			league.seasons.push(newSeason);
		}

		const isNewWeekCreated = this.createNewWeekForLeagues(leagues, updatedWeekTracker);
		if (!isNewWeekCreated) {
			return ApiResponseMessage.DATABASE_ERROR;
		}

		const isSaveSuccess = this.leagueRepository.saveLeaguesAndWeekTracker(leagues, updatedWeekTracker);
		if (isSaveSuccess) {
			return ApiResponseMessage.CREATE_SUCCESS;
		}
		return ApiResponseMessage.CREATE_FAIL;
	}

	public async modifyLeague(userId: string, data: ModifyLeagueDto): Promise<LeagueDto> {
		const league = await this.leagueRepository.getLeagueById(data.leagueId);
		const weekTracker = await this.weekTrackerRepository.getTracker();
		if (!league || userId !== league.creator || !weekTracker) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}

		league.leagueAvatarUrl = data.avatar;
		league.name = data.name;

		const saveResponse = await this.leagueRepository.updateLeagues([league]);
		if (saveResponse) {

			const teamStandings = await this.getTeamStandingsData(weekTracker.year);
			await Utils.waitFor(1500);

			const league = saveResponse.find(league => league.id === data.leagueId);
			return Utils.mapToLeagueDto(league, teamStandings);
		}
		throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
	}

	public async deleteLeague(userId: string, leagueId: string): Promise<boolean> {
		const league = await this.leagueRepository.getLeagueById(leagueId);
		if (!league || userId !== league.creator) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		const players = await this.userRepositoryService.getUsersByIds(league.players.map(p => p.id))
		if (!players) {
			throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
		}
		for (const player of players) {
			player.leagues = player.leagues.filter(l => l.leagueId !== leagueId);
		}

		const isDeleteSuccess = await this.leagueRepository.deleteLeague(league.id, players);
		if (isDeleteSuccess) {
			return true;
		}
		throw new HttpError(this.serverErrorCode, ApiResponseMessage.DATABASE_ERROR);
	}

	private stepWeekTracker(weekTracker: WeekTrackerDocument): WeekTrackerDocument {
		if (weekTracker.regOrPst === WeekType.POSTSEASON && weekTracker.week === 4) {
			weekTracker.regOrPst = WeekType.REGULAR;
			weekTracker.week = 1;
			weekTracker.year++;
			return weekTracker;
		}

		if (weekTracker.regOrPst === WeekType.REGULAR && weekTracker.week === 18) {
			weekTracker.week = 1;
			weekTracker.regOrPst = WeekType.POSTSEASON;
		} else {
			weekTracker.week++;
		}
		return weekTracker;
	}

	private getSuperbowlWinner (game: any): string {
		const winner = game.scoring.home_points > game.scoring.away_points ? 'home' : 'away';
		return game[winner].alias;
	}

	private checkFinalWinnerBets(season: SeasonDocument, winner: string) {
		const hitWinnerPoints = 30;
		for (const userId of Object.keys(season.finalWinner)) {
			if (season.finalWinner[userId] === winner) {
				const userStanding = season.standings.find(standing => standing.id.toString() === userId);
				if (userStanding) {
					userStanding.score += hitWinnerPoints;
				}
			}
		}
	}

	private evaluateWeek(leagueGames: GameDocument[], gamesResults: any[], resultObject: any) {
		const outcomePoints = 1;
		const intervalPoints = 4;
		for (const gameResult of gamesResults) {
			if (!(gameResult.status === GameStatus.CLOSED || gameResult.status === GameStatus.POSTPONED)) {
				continue;
			}
			const gameToEvaluate = leagueGames.find(game => game.gameId === gameResult.id);
			if (!gameToEvaluate) {
				continue;
			}
			if (!gameToEvaluate.isOpen) {
				continue;
			}
			const scoring = gameResult.scoring;
			gameToEvaluate.status = gameResult.status;
			gameToEvaluate.homeScore = scoring.home_points;
			gameToEvaluate.awayScore = scoring.away_points;

			const pointDiff = gameToEvaluate.homeScore - gameToEvaluate.awayScore;

			if (pointDiff === 0) {
				gameToEvaluate.winner = GameOutcome.TIE;
				gameToEvaluate.winnerValue = BetType.TIE;
			} else if (pointDiff <= -15) {
				gameToEvaluate.winnerValue = BetType.AWAY_15_PLUS;
			} else if (pointDiff <= -8) {
				gameToEvaluate.winnerValue = BetType.AWAY_8_14;
			} else if (pointDiff <= -4) {
				gameToEvaluate.winnerValue = BetType.AWAY_4_7;
			} else if (pointDiff <= -1) {
				gameToEvaluate.winnerValue = BetType.AWAY_0_3;
			} else if (pointDiff <= 3) {
				gameToEvaluate.winnerValue = BetType.HOME_0_3;
			} else if (pointDiff <= 7) {
				gameToEvaluate.winnerValue = BetType.HOME_4_7;
			} else if (pointDiff <= 14) {
				gameToEvaluate.winnerValue = BetType.HOME_8_14;
			} else if (pointDiff >= 15) {
				gameToEvaluate.winnerValue = BetType.HOME_15_PLUS;
			}

			if (pointDiff > 0) {
				gameToEvaluate.winner = GameOutcome.HOME;
				gameToEvaluate.winnerTeamAlias = gameToEvaluate.homeTeamAlias;
			} else if (pointDiff < 0) {
				gameToEvaluate.winner = GameOutcome.AWAY;
				gameToEvaluate.winnerTeamAlias = gameToEvaluate.awayTeamAlias;
			}
			for (const bet of gameToEvaluate.bets) {
				if (!bet.bet) {
					continue;
				}
				if (gameToEvaluate.winnerValue === BetType.TIE) {
					if (bet.bet === BetType.HOME_0_3 || bet.bet === BetType.AWAY_0_3) {
						resultObject[bet.id.toString()] += intervalPoints;
					}
				} else {
					if (bet.bet === gameToEvaluate.winnerValue) {
						resultObject[bet.id.toString()] += intervalPoints;
					} else if (bet.bet.startsWith(gameToEvaluate.winnerValue.substring(0, 4))) {
						resultObject[bet.id.toString()] += outcomePoints;
					}
				}
			}

			gameToEvaluate.isOpen = false;
		}

		return resultObject;
	}

	private isSuperBowlWeek(week: any): boolean {
		return week.type === WeekType.POSTSEASON && week.week.sequence === 4;
	}

	private saveBetsForOneLeague(userId: string, league: LeagueDocument, betsDto: BetDto, currentYear: number): void {
		const currentSeason = league.seasons.find(season => season.year === currentYear);
		if (!currentSeason) {
			return;
		}
		const currentWeek = currentSeason.weeks.find(weekToFind => weekToFind.weekId === betsDto.weekId);
		const currentTime = new Date().getTime();

		for (const game of currentWeek.games) {
			if (new Date(game.startTime).getTime() < currentTime) {
				continue;
			}
			const bet = betsDto.bets.find(gameBet => gameBet.gameId === game.gameId);
			if (!bet) {
				continue;
			}
			const userBet = game.bets.find(bet => bet.id.toString() === userId);
			if (Object.values(BetType).includes(bet.bet)) {
				userBet.bet = bet.bet;
			}
		}
	}

	private createLeagueDocument(user: UserDocument, leagueData: CreateLeagueDTO, year: number) {
		const userId = user._id.toString();
		return new LeagueModel({
			name: leagueData.name,
			creator: userId,
			invitations: [],
			players: [{ id: userId, name: user.username, avatar: user.avatarUrl }],
			seasons: [
				new SeasonModel({
					year: year,
					numberOfSeason: year - 1919,
					numberOfSuperBowl: year - 1965,
					weeks: [],
					standings: [{ id: userId, name: user.username, score: 0 }],
					finalWinner: {
						[userId]: null
					},
					isOpen: true
				})
			],
			leagueAvatarUrl: leagueData.leagueAvatarUrl || null
		});
	}

	private async createNewWeekForLeagues(leagues: LeagueDocument[], weekTracker: WeekTrackerDocument): Promise<boolean> {
		const weekData = await this.dataService.getWeekData(weekTracker);
		if (!weekData) {
			return false;
		}

		for (const league of leagues) {
			const currentSeason = league.seasons.find(season => season.year === weekData.year);
			if (currentSeason.weeks.find(week => week.weekId === weekData.week.id)) {
				return;
			}
			currentSeason.weeks.push(this.createNewWeekModel(weekData, league));
		}
		return true;
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
				newGame.bets.push({ id: player.id, name: player.name, bet: null });
			}
			week.games.push(newGame);
		}
		return week;
	}

}
