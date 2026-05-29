import { RestErrorProvider } from './rest-error.provider';
export const ErrUnauthorized = RestErrorProvider.create({
  httpCode: 401,
  title: 'Unauthorized',
  message: 'You are not authorized to perform this action',
  code: 'UNAUTHORIZED',
});

export const ErrForbidden = RestErrorProvider.create({
  httpCode: 403,
  title: 'Forbidden',
  message: 'You do not have permission to perform this action',
  code: 'FORBIDDEN',
});

export const ErrNotFound = RestErrorProvider.create({
  httpCode: 404,
  title: 'Not Found',
  message: 'The requested resource was not found',
  code: 'RESOURCE_NOT_FOUND',
});

export const ErrInternalServer = RestErrorProvider.create({
  httpCode: 500,
  title: 'Internal Server Error',
  message: 'Something went wrong please try again later',
  code: 'INTERNAL_SERVER_ERROR',
});
