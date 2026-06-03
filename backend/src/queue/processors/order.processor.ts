import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';

export type OrderConfirmationJob = {
  orderId: string;
  userEmail: string;
  eventTitle: string;
  seatNumber: number;
  amount: number;
};

@Injectable()
@Processor(QUEUE_NAMES.ORDER, {
  concurrency: 50, // Process max 50 emails at a time
  limiter: {
    max: 100, // Max 100 jobs
    duration: 1000, // per 1 second
  },
})
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_NAMES.ORDER_CONFIRMATION:
        await this.handleOrderConfirmation(job.data as OrderConfirmationJob);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleOrderConfirmation(
    data: OrderConfirmationJob,
  ): Promise<void> {
    // Simulated email — Razorpay integration will trigger this via webhook
    this.logger.log(
      `Confirmation email sent to ${data.userEmail}
       Order: ${data.orderId}
       Event: ${data.eventTitle}
       Seat: ${data.seatNumber}
       Amount: ₹${data.amount}`,
    );
  }
}
