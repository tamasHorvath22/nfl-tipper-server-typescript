import mongoose, { Schema } from 'mongoose';
import { UserDocument } from '../documents/user.document';
import { DocumentName } from '../constants/document-names';
import bcrypt from 'bcryptjs';

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

userSchema.pre('save', async function (next: any) {
  const thisObj = this as UserDocument;

  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    thisObj.password = await bcrypt.hash(thisObj.password, salt);
    return next();
  } catch (e) {
    return next(e);
  }
});

userSchema.methods.validatePassword = async function (pass: string) {
  return bcrypt.compare(pass, this.password);
};

export default mongoose.model<UserDocument>(DocumentName.USER, userSchema);
