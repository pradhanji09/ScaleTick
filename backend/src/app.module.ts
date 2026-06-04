import { QueueModule } from './common/queue/queue.module';
import { OrderModule } from './Orders/orders.module';
import { EventsModule } from './Events/events.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './Users/entities/user.entity';
import { Order } from './Orders/entities/order.entity';
import { Ticket } from './Tickets/entities/ticket.entity';
import { LoggerModule } from 'nestjs-pino';
import { createLoggerConfig } from './common/logger/logger.config';
import { AuthModule } from './Auth/auth.module';
import { UsersModule } from './Users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RoleGuard } from './common/guards/roles.guard';
import { Event } from './Events/entities/event.entity';
import { TicketModule } from './Tickets/tickets.module';
import { RedisModule } from './common/redis/redis.module';

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [User, Event, Order, Ticket],
        synchronize: (process.env.NODE_ENV as string) === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    EventsModule,
    TicketModule,
    RedisModule,
    OrderModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
