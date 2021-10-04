import { BaseDocument } from "./base.document";
import { WeekType } from "../constants/week-type";

export interface WeekTrackerDocument extends BaseDocument {
	year: number;
	week: number;
	regOrPst: WeekType;
}