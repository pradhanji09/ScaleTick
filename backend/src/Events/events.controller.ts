import { CreateEventDto } from './dto/create-event.dto';
import { AdminOnly } from './../common/decorators/roles.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventService: EventsService) {}

  @AdminOnly()
  @Post()
  createEvent(@Body() data: CreateEventDto) {
    return this.eventService.createEvent(data);
  }
}
