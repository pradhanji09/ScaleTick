import { RestErrorProvider } from '../common/errors/rest-error.provider';

export const EventNotFound = RestErrorProvider.create({
  httpCode: 404,
  title: 'Event Not Found',
  message: 'Event not found with this id',
  code: 'EVENT_NOT_FOUND',
});

export const EventNotLive = RestErrorProvider.create({
  httpCode: 400,
  title: 'Event Not Live',
  message: 'Event is not live for booking',
  code: 'EVENT_NOT_LIVE',
});

export const InvalidStatusTransition = RestErrorProvider.create({
  httpCode: 400,
  title: 'Invalid Status Transition',
  message: 'This status transition is not allowed',
  code: 'INVALID_STATUS_TRANSITION',
});

export const EventAlreadyCancelled = RestErrorProvider.create({
  httpCode: 400,
  title: 'Event Already Cancelled',
  message: 'This event has already been cancelled',
  code: 'EVENT_ALREADY_CANCELLED',
});

export const EventCanNotStartsInPast = RestErrorProvider.create({
  httpCode: 400,
  title: 'Invalid Event Date',
  message: 'Event start date cannot be in the past',
  code: 'EVENT_STARTS_IN_PAST',
});

export const EventCanNotEndsInPast = RestErrorProvider.create({
  httpCode: 400,
  title: 'Invalid Event Date',
  message: 'Event end date cannot be in the past',
  code: 'EVENT_ENDS_IN_PAST',
});

export const EventEndBeforeStart = RestErrorProvider.create({
  httpCode: 400,
  title: 'Invalid Event Date',
  message: 'Event end date must be after start date',
  code: 'EVENT_END_BEFORE_START',
});
