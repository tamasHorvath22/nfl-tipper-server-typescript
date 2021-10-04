import { BetType } from '../constants/bet-types';

export interface BetDto {
	leagueId: string;
	weekId: string;
	isForAllLeagues: boolean;
	bets: GameBetDto[];
}

export interface GameBetDto {
	gameId: string;
	bet: BetType;
}
