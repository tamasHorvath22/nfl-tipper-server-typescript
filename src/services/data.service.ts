import { Service } from "typedi";
import { ConfigService, EnvKey } from './config.service';
import {WeekTrackerDocument} from "../documents/week-tracker.document";
import axios from 'axios';

@Service()
export class DataService {

	private baseUrl = 'https://api.sportradar.us/nfl/official/trial';
	private v5 = '/v5/en';
	private v6 = '/v6/en'

	public async getWeekData(weekTracker: WeekTrackerDocument) {
		const gamesUrl = '/games/';
		const apiKeyPart = '/schedule.json?api_key='

		const base = `${this.baseUrl}${this.v5}${gamesUrl}`;
		const weekUrl = `${weekTracker.year}/${weekTracker.regOrPst}/${weekTracker.week}`;
		const path = `${base}${weekUrl}${apiKeyPart}${ConfigService.getEnvValue(EnvKey.SPORTRADAR_KEY)}`
		try {
			const weekData = await axios.get(path);
			return weekData.data;
		} catch(err) {
			console.error(err);
			return null;
		}
	}

	public async getTeamStandingsData(year: number): Promise<any> {
		const standingUrl = `/seasons/${year}/REG/standings/season.json?api_key='`;
		const path = `${this.baseUrl}${this.v6}${standingUrl}${ConfigService.getEnvValue(EnvKey.SPORTRADAR_KEY)}`;

		try {
			return await axios.get(path);
		} catch {
			return null;
		}
	}

}
