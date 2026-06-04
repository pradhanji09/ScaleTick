import { EventStatus } from './../../common/enums/event-status.enum';
import { JOB_NAMES, QUEUE_NAMES } from './../../common/queue/queue.constants';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EVENT) private readonly eventQueue: Queue,
  ) {}

  async scheduleLifecycle(event: Event): Promise<void> {
    const now = Date.now();
    const liveDelay = Math.max(0, event.starts_at.getTime() - now);
    const endDelay = Math.max(0, event.ends_at.getTime() - now);

    await Promise.all([
      this.eventQueue.add(
        JOB_NAMES.EVENT_GO_LIVE,
        { eventId: event.id, targetStatus: EventStatus.LIVE },
        { delay: liveDelay, jobId: `go-live-${event.id}` },
      ),
      this.eventQueue.add(
        JOB_NAMES.EVENT_GO_ENDED,
        { eventId: event.id, targetStatus: EventStatus.ENDED },
        { delay: endDelay, jobId: `go-ended-${event.id}` },
      ),
    ]);
  }

  async cancelLifecycle(eventId: string): Promise<void> {
    await Promise.all([
      this.eventQueue.remove(`go-live-${eventId}`),
      this.eventQueue.remove(`go-ended-${eventId}`),
    ]);
  }
}
