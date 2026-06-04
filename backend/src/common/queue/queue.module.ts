import { EventsModule } from 'src/Events/events.module';
import { EventProcessor } from '../../Events/queue/event.processor';
import { OrderProcessor } from '../../Orders/queue/order.processor';
import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Connecting to same Redis Instance for Queue also
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.ORDER,
        defaultJobOptions: {
          attempts: 3, // retry 3 times
          backoff: {
            type: 'exponential', // wait longer between each retry
            delay: 5000, // 5s, 10s, 20s
          },
          removeOnComplete: true, // clean up completed jobs
          removeOnFail: false, // keep failed jobs for inspection
        },
      },
      {
        name: QUEUE_NAMES.EVENT,
        defaultJobOptions: {
          attempts: 5, // more retries for critical lifecycle jobs
          backoff: {
            type: 'exponential',
            delay: 10000, // 10s, 20s, 40s, 80s, 160s
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
    EventsModule,
  ],
  providers: [OrderProcessor, EventProcessor],
  exports: [BullModule],
})
export class QueueModule {}
