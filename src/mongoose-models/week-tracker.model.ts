import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import {WeekTrackerDocument} from "../documents/week-tracker.document";

const weekTrackerSchema = new Schema<WeekTrackerDocument>({
	year: { type : Number },
	week: { type : Number },
	regOrPst: { type: String }
}, { timestamps: true });

export default mongoose.model<WeekTrackerDocument>(DocumentName.WEEK_TRACKER, weekTrackerSchema);
