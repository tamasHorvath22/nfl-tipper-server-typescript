import { Service } from "typedi";
import { WeekTrackerDocument } from "../documents/week-tracker.document";
import WeekTrackerModel from '../mongoose-models/week-tracker.model';

@Service()
export class WeekTrackerRepository {

	public async getTracker(): Promise<WeekTrackerDocument> {
		try {
			const tracker = await WeekTrackerModel.find({}).exec();
			if (tracker && tracker.length) {
				return tracker[0];
			}
			return null;
		} catch (err) {
			console.error(err);
			return null;
		}
	}
}
