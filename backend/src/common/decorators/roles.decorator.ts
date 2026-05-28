import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'isAdmin';
export const AdminOnly = () => SetMetadata(ROLES_KEY, true);
