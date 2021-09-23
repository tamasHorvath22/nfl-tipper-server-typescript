import jwtDecode from "jwt-decode";
import { UserDocument } from "./documents/user.document";
import { UserDTO } from "./types/user-dto";
import { LeagueDocument } from "./documents/league.document";
import { LeagueDto } from "./types/league.dto";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "./services/config.service";
import { TeamStandingsDto } from "./types/team-standings.dto";

export class Utils {

	public static getUserFromToken(authorization: string): UserDTO {
		return jwtDecode(authorization.slice(7));
	}

	public static mapToUserDto(user: UserDocument): UserDTO {
		return {
			id: user._id.toString(),
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			isEmailConfirmed: user.isEmailConfirmed,
			isAdmin: user.isAdmin,
			leagues: user.leagues.map(league => league.leagueId),
			invitations: user.invitations
		}
	}

	public static mapToLeagueDto(league: LeagueDocument, teamStandings: TeamStandingsDto): LeagueDto {
		return {
			players: league.players,
			invitations: league.invitations,
			seasons: league.seasons.map(season => {
				return {
					...season,
					id: season._id.toString(),
					weeks: season.weeks.map(week => {
						return {
							...week,
							id: week._id.toString(),
							games: week.games.map(game => {
								return {
									...game,
									id: game._id.toString()
								}
							})
						}
					})
				}
			}),
			name: league.name,
			creator: league.creator,
			leagueAvatarUrl: league.leagueAvatarUrl,
			id: league._id.toString(),
			teamStandings: teamStandings
		}
	}

	public static signToken(user: UserDocument): { token: string } {
		return { token: jwt.sign(Utils.mapToUserDto(user), ConfigService.getEnvValue('JWT_PRIVATE_KEY')) };
	}

	public static waitFor(millis: number): Promise<void> {
		return new Promise(resolve => setTimeout(() => resolve(), millis));
	}

}