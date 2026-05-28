import { User } from './entities/user.entity';
import { userResponse } from './users.types';

export class userTransformer {
  static toRegisterResponse(user: User): userResponse {
    return {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      createdAt: user.created_at,
    };
  }
}
