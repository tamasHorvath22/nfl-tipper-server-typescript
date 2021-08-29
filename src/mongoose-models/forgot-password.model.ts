import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { ForgotPasswordDocument } from '../documents/forgot-password.document';

const forgotPasswordSchema = new Schema<ForgotPasswordDocument>({
  email: { type : String }
}, { timestamps: true });

export default mongoose.model<ForgotPasswordDocument>(DocumentName.FORGOT_PASSWORD, forgotPasswordSchema);
