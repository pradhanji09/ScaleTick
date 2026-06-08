import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { HealthModule } from './Health/health.module';
import { QueueModule } from './common/queue/queue.module';
import { OrderModule } from './Orders/orders.module';
import { EventsModule } from './Events/events.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { createLoggerConfig } from './common/logger/logger.config';
import { AuthModule } from './Auth/auth.module';
import { UsersModule } from './Users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RoleGuard } from './common/guards/roles.guard';
import { TicketModule } from './Tickets/tickets.module';
import { RedisModule } from './common/redis/redis.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { dataSourceOptions } from './common/database/data-source';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { entities, migrations, ...safeNestOptions } = dataSourceOptions;
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createLoggerConfig(config),
    }),
    TypeOrmModule.forRoot({
      ...safeNestOptions,
      autoLoadEntities: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute window
            limit: 100, // 100 requests per minute default
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        }),
      }),
    }),
    UsersModule,
    AuthModule,
    EventsModule,
    TicketModule,
    RedisModule,
    OrderModule,
    QueueModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
