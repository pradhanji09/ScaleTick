import { EventStatus } from './../../common/enums/event-status.enum';

const allowedTransitions: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.SCHEDULED],
  [EventStatus.SCHEDULED]: [EventStatus.LIVE, EventStatus.CANCELLED],
  [EventStatus.LIVE]: [
    EventStatus.ENDED,
    EventStatus.CANCELLED,
    EventStatus.SOLD_OUT,
  ],
  [EventStatus.ENDED]: [],
  [EventStatus.CANCELLED]: [],
  [EventStatus.SOLD_OUT]: [],
};

export class EventStateMachine {
  static canTransition(current: EventStatus, next: EventStatus): boolean {
    return allowedTransitions[current].includes(next);
  }
}
