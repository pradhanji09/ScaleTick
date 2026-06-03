import { OrderStatus } from './../common/enums/order-status.enum';

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  amount: number;
  userId: number;
  eventId: string;
  ticketId: string;
  createdAt: Date;
}
