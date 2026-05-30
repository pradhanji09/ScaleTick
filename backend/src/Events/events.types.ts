import { EventStatus } from '../common/enums/event-status.enum';

export type EventResponse = {
  id: string;
  event_title: string;
  event_description?: string | null;
  total_tickets: number;
  available_tickets: number;
  price: number;
  status: EventStatus;
  starts_at: Date;
  // ends_at: Date;
  // created_at: Date;
};
