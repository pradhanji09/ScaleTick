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

export type OrderDetailResponse = {
  id: string;
  status: OrderStatus;
  amount: number;
  createdAt: Date;
  event: {
    id: string;
    event_title: string;
    starts_at: Date;
    ends_at: Date;
    price: number;
  } | null;
  ticket: {
    id: string;
    seat_number: number;
    price: number;
  } | null;
};
