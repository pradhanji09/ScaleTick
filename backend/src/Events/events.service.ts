import { EventStateMachine } from './transitions/event-transitions';
import { EventStatus } from './../common/enums/event-status.enum';
import {
  EventCanNotStartsInPast,
  EventCanNotEndsInPast,
  EventEndBeforeStart,
  EventNotFound,
  InvalidStatusTransition,
} from './events.errors';
import { EventTransformer } from './events.transformer';
import { TicketsService } from './../Tickets/tickets.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Event } from './../Events/entities/event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventResponse } from './events.types';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly ticketService: TicketsService,
    private readonly dataSource: DataSource,
  ) {}
  async createEvent(data: CreateEventDto): Promise<EventResponse> {
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

  async getAllEvent(): Promise<EventResponse[]> {
    const events = await this.eventRepository.find({
      where: [{ status: EventStatus.SCHEDULED }, { status: EventStatus.LIVE }],
      order: { starts_at: 'ASC' },
    });

    return events.map((event) => EventTransformer.toResponse(event));
  }

  async getEventById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) throw EventNotFound;

    return EventTransformer.toResponse(event);
  }

  async updateEventStatus(id: string, data: UpdateEventStatusDto) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw EventNotFound;

    const canTransition = EventStateMachine.canTransition(
      event.status,
      data.status,
    );
    if (!canTransition) throw InvalidStatusTransition;

    event.status = data.status;
    const updated = await this.eventRepository.save(event);

    return EventTransformer.toResponse(updated);
  }
}
