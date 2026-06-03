import { Order } from './entities/order.entity';
import { OrderResponse } from './orders.type';

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
}
