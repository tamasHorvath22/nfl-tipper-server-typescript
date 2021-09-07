import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { WeekDocument } from '../documents/league.document';

const weekSchema = new Schema<WeekDocument>({
  weekId: String,
  number: Number,
  isOpen: Boolean,
  games: []
}, { timestamps: true });

export default mongoose.model<WeekDocument>(DocumentName.WEEK, weekSchema);
