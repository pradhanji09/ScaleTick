import { EventStatus } from './../../common/enums/event-status.enum';
import { IsEnum, IsNotIn } from 'class-validator';

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  @IsNotIn([EventStatus.CANCELLED], {
    message:
      'Cannot change status to CANCELLED using this endpoint. Please use the dedicated events/cancel endpoint.',
  })
  status: EventStatus;
}
