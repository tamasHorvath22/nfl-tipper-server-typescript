import { UserInvitation } from '../documents/user.document';

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  leagues: string[];
  invitations: UserInvitation[];
}
