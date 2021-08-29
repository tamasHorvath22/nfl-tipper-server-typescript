export interface UserDocument {
  username: string;
  password: string;
  email: string;
  avatarUrl: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  leagues: string[];
  invitations: string[];
  validatePassword(password: string): boolean;
}
