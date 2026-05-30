import { EventResponse } from './events.types';
import { EventStatus } from './../common/enums/event-status.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';

export class EventTransformer {
  static toEventEntity(data: CreateEventDto) {
    return {
      event_title: data.event_title,
      event_description: data.event_description ?? null,
      total_tickets: data.total_tickets,
      available_tickets: data.total_tickets,
      price: data.price,
      status: EventStatus.DRAFT,
      starts_at: new Date(data.starts_at),
      ends_at: new Date(data.ends_at),
    };
  }
  static toResponse(event: Event): EventResponse {
    return {
      id: event.id,
      event_title: event.event_title,
      ...(event.event_description && {
        event_description: event.event_description,
      }),
      total_tickets: event.total_tickets,
      available_tickets: event.available_tickets,
      price: event.price,
      status: event.status,
      starts_at: event.starts_at,
      // ends_at: event.ends_at,
      // created_at: event.created_at,
    };
  }
}
