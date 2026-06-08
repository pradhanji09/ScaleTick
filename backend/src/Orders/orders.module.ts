import { OrdersService } from './orders.service';
import { OrdersCntroller } from './orders.controller';
import { EventsModule } from './../Events/events.module';
import { TicketModule } from './../Tickets/tickets.module';
import { Order } from './entities/order.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), TicketModule, EventsModule],
  controllers: [OrdersCntroller],
  providers: [OrdersService],
})
export class OrderModule {}
