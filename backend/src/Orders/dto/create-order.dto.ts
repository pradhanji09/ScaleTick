import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4', { message: 'eventId must be a valid UUID v4' })
  eventId: string;

  @IsUUID('4', { message: 'ticketId must be a valid UUID v4' })
  ticketId: string;
}
