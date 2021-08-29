import { EmailConfirmDocument } from './../documents/email-confirm.document';
import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';

const emailConfirmSchema = new Schema<EmailConfirmDocument>({
  email: { type : String },
  userId: { type : String }
}, { timestamps: true });

export default mongoose.model<EmailConfirmDocument>(DocumentName.EMAIL_CONFIRM, emailConfirmSchema);
