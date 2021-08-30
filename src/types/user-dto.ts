export interface UserDTO {
  _id: string;
  username: string;
  email: string;
  avatarUrl: string;
  isEmailConfirmed: boolean;
  isAdmin: boolean;
  leagues: [];
  invitations: [];
}
