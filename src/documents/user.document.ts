import { BaseDocument } from "./base.document";

export interface UserDocument extends BaseDocument {
  nickname: string;
  username: string;
  password: string;
  email: string;
  avatarUrl: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  leagues: UserLeagues[];
  invitations: UserInvitation[];
  validatePassword(password: string): boolean;
}

export interface UserLeagues {
  leagueId: string;
  name: string
}

export interface UserInvitation {
  leagueId: string;
  name: string;
}
