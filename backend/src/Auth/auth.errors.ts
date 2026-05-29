import { RestErrorProvider } from './../common/errors/rest-error.provider';
export const UserAlreadyExists = RestErrorProvider.create({
  httpCode: 409,
  title: 'Registration Failed',
  message: 'User already exists with this email',
  code: 'USER_ALREADY_EXISTS',
});

export const InvalidCredentials = RestErrorProvider.create({
  httpCode: 401,
  title: 'Authentication Failed',
  message: 'Invalid email or password',
  code: 'INVALID_CREDENTIALS',
});

export const UserNotFound = RestErrorProvider.create({
  httpCode: 404,
  title: 'User not Found',
  message: 'User not found with this email',
  code: 'USER_NOT_FOUND',
});
