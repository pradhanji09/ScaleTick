import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { Public } from './../common/decorators/public.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { AdminOnly } from './../common/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventService: EventsService) {}

  @AdminOnly()
  @Post()
  createEvent(@Body() data: CreateEventDto) {
    return this.eventService.createEvent(data);
  }

  @Public()
  @Get()
  getAllEvent() {
    return this.eventService.getAllEvent();
  }

  @Public()
  @Get(':id')
  getEventById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.getEventById(id);
  }

  @AdminOnly()
  @Patch(':id/status')
  updateEventStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateEventStatusDto,
  ) {
    return this.eventService.updateEventStatus(id, data);
  }

  @AdminOnly()
  @Post(':id/cancel')
  cancelEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.cancelEvent(id);
  }

  @Public()
  @Get(':id/tickets')
  findAvailableTickets(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventService.getAvailableTickets(id);
  }
}
