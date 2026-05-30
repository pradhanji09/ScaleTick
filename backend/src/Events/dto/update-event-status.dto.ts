import { EventStatus } from './../../common/enums/event-status.enum';
import { IsEnum } from 'class-validator';

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}
