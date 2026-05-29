import {
  EventCanNotStartsInPast,
  EventCanNotEndsInPast,
  EventEndBeforeStart,
} from './events.errors';
import { EventTransformer } from './events.transformer';
import { TicketsService } from './../Tickets/tickets.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Event } from './../Events/entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    private readonly ticketService: TicketsService,
    private readonly dataSource: DataSource,
  ) {}
  async createEvent(data: CreateEventDto) {
    const now = new Date();
    const startsAt = new Date(data.starts_at);
    const endsAt = new Date(data.ends_at);

    if (startsAt < now) throw EventCanNotStartsInPast;
    if (endsAt < now) throw EventCanNotEndsInPast;
    if (endsAt <= startsAt) throw EventEndBeforeStart;
    return await this.dataSource.transaction(async (manager) => {
      const event = EventTransformer.toEventEntity(data);
      const eventEntity = manager.create(Event, event);
      const savedEvent = await manager.save(Event, eventEntity);
      await this.ticketService.bulkTicketGenerate({
        eventId: savedEvent.id,
        count: savedEvent.total_tickets,
        price: savedEvent.price,
        manager: manager,
      });
      return EventTransformer.toResponse(savedEvent);
    });
  }
}
