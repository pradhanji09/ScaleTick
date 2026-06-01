import { TicketStatus } from '../common/enums/ticket-status.enum';

export interface TicketResponse {
  id: string;
  seat_number: number;
  status: TicketStatus;
  price: number;
  eventId: string;
}
