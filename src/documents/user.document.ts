import { BaseDocument } from "./base.document";

export interface UserDocument extends BaseDocument {
  username: string;
  password: string;
  email: string;
  avatarUrl: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  leagues: [];
  invitations: [];
  validatePassword(password: string): boolean;
}
