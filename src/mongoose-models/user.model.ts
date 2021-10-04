import mongoose, { Schema } from 'mongoose';
import { UserDocument } from '../documents/user.document';
import { DocumentName } from '../constants/document-names';

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true, dropDups: true },
  password: String,
  nickname: String,
  email: { type : String, unique: true, required: true },
  avatarUrl: String,
  isEmailConfirmed: Boolean,
  isAdmin: Boolean,
  leagues: [],
  invitations: []
}, { timestamps: true });

export default mongoose.model<UserDocument>(DocumentName.USER, userSchema);
