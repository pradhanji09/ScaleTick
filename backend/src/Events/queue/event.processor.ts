import { EventStatus } from '../../common/enums/event-status.enum';
import { EventsService } from '../events.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../../common/queue/queue.constants';

export type EventLifecycleJob = {
  eventId: string;
  targetStatus: EventStatus;
};

@Injectable()
@Processor(QUEUE_NAMES.EVENT)
export class EventProcessor extends WorkerHost {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(private readonly eventsService: EventsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_NAMES.EVENT_GO_LIVE:
      case JOB_NAMES.EVENT_GO_ENDED:
        await this.handleEventLifecycle(job.data as EventLifecycleJob);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleEventLifecycle(data: EventLifecycleJob): Promise<void> {
    try {
      await this.eventsService.updateEventStatus(data.eventId, {
        status: data.targetStatus,
      });
      this.logger.log(
        `Event ${data.eventId} transitioned to ${data.targetStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to transition event ${data.eventId} to ${data.targetStatus}`,
        error,
      );
      // Rethrow so BullMQ retries the job
      throw error;
    }
  }
}
