import { Order } from './entities/order.entity';
import { OrderResponse, OrderDetailResponse } from './orders.type';

export class OrderTransformer {
  static toResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      status: order.status,
      amount: Number(order.amount),
      userId: order.userId,
      eventId: order.eventId,
      ticketId: order.ticketId,
      createdAt: order.created_at,
    };
  }

  static toDetailResponse(order: Order): OrderDetailResponse {
    return {
      id: order.id,
      status: order.status,
      amount: Number(order.amount),
      createdAt: order.created_at,
      event: order.event
        ? {
            id: order.event.id,
            event_title: order.event.event_title,
            starts_at: order.event.starts_at,
            ends_at: order.event.ends_at,
            price: Number(order.event.price),
          }
        : null,
      ticket: order.ticket
        ? {
            id: order.ticket.id,
            seat_number: order.ticket.seat_number,
            price: Number(order.ticket.price),
          }
        : null,
    };
  }
}
