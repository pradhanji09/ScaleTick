import { Ticket } from './entities/ticket.entity';
import { TicketResponse } from './tickets.types';

export class TicketTransformer {
  static toResponse(ticket: Ticket): TicketResponse {
    return {
      id: ticket.id,
      seat_number: ticket.seat_number,
      status: ticket.status,
      price: Number(ticket.price),
      eventId: ticket.eventId,
    };
  }
}
