import { BaseDocument } from "./base.document";

export interface UserDocument extends BaseDocument {
  username: string;
  password: string;
  email: string;
  avatarUrl: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  leagues: UserLeagues[];
  invitations: [];
  validatePassword(password: string): boolean;
}

export interface UserLeagues {
  leagueId: string;
  name: string
}
