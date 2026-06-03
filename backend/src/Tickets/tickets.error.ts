import { RestErrorProvider } from './../common/errors/rest-error.provider';

export const TicketNotFound = RestErrorProvider.create({
  httpCode: 400,
  title: 'Ticket Not Found',
  message: 'This not Found with this ID',
  code: 'TICKET_NOT_FOUND',
});

export const TicketDoesNotBelongToEvent = RestErrorProvider.create({
  httpCode: 400,
  title: 'Invalid Request',
  message: 'Ticket does not belong to this event',
  code: 'TICKET_DOES_NOT_BELONG_TO_EVENT',
});

export const TicketAlreadyBooked = RestErrorProvider.create({
  httpCode: 400,
  title: 'Ticket Unavailable',
  message: 'This ticket has already been booked',
  code: 'TICKET_ALREADY_BOOKED',
});
