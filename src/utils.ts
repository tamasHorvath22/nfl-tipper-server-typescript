import {TokenUser} from "./types/token-user";
import jwtDecode from "jwt-decode";
import {UserDocument} from "./documents/user.document";
import {UserDTO} from "./types/user-dto";

export class Utils {

	public static getUserFromToken(authorization: string): TokenUser {
		return jwtDecode(authorization.slice(7));
	}

	public static mapToUserDto(user: UserDocument): UserDTO {
		return {
			_id: user._id.toString(),
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			isEmailConfirmed: user.isEmailConfirmed,
			isAdmin: user.isAdmin,
			leagues: user.leagues,
			invitations: user.invitations
		}
	}
}