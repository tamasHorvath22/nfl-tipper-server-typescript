import { Service } from "typedi";
import { ConfigService } from './config.service';
import {WeekTrackerDocument} from "../documents/week-tracker.document";
import axios from 'axios';

@Service()
export class DataService {

	private baseUrl = 'https://api.sportradar.us/nfl/official/trial/v5/en';

	public async getWeekData(weekTracker: WeekTrackerDocument) {
		const gamesUrl = '/games/';
		const apiKeyPart = '/schedule.json?api_key='

		const base = `${this.baseUrl}${gamesUrl}`;
		const weekUrl = `${weekTracker.year}/${weekTracker.regOrPst}/${weekTracker.week}`;
		const path = `${base}${weekUrl}${apiKeyPart}${ConfigService.getEnvValue('SPORTRADAR_KEY')}`
		try {
			const weekData = await axios.get(path);
			return weekData.data;
		} catch(err) {
			console.error(err);
			return null;
		}
	}

	public async getTeamStandingsData(): Promise<any> {
		const standingUrl = '/seasons/2020/standings.json?api_key=';
		const path = `${this.baseUrl}${standingUrl}${ConfigService.getEnvValue('SPORTRADAR_KEY')}`;

		try {
			return await axios.get(path);
		} catch {
			return null;
		}
	}

}
