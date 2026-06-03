import { OrderTransformer } from './orders.transformer';
import { OrderStatus } from './../common/enums/order-status.enum';
import { Order } from './entities/order.entity';
import { LockAcquisitionFailed } from './../common/errors/common.errors';
import { RedisService } from './../common/redis/redis.service';
import { TicketsService } from './../Tickets/tickets.service';
import { EventNotLive } from './../Events/events.errors';
import { EventStatus } from './../common/enums/event-status.enum';
import { User } from './../Users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsService } from './../Events/events.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketDoesNotBelongToEvent } from 'src/Tickets/tickets.error';

@Injectable()
export class OrdersService {
  private readonly LOCK_TTL = 10;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventService: EventsService,
    private readonly ticketService: TicketsService,
    private readonly redisService: RedisService,
  ) {}

  async createOrder(body: CreateOrderDto, user: User, idempotencyKey: string) {
    const { id: userId } = user;
    const { eventId, ticketId } = body;

    const event = await this.eventService.getEventById(eventId);
    if (event.status !== EventStatus.LIVE) throw EventNotLive;

    const ticket = await this.ticketService.getTicketById(ticketId);
    if (ticket.eventId !== event.id) throw TicketDoesNotBelongToEvent;

    const lockKey = `lock:ticket:${ticketId}`;

    const lockToken = await this.redisService.acquireLock(
      lockKey,
      this.LOCK_TTL,
    );
    if (!lockToken) throw LockAcquisitionFailed;

    try {
      const order = await this.dataSource.transaction(async (manager) => {
        await this.ticketService.reserveTicket(ticketId, manager);

        const orderEntity = manager.create(Order, {
          userId,
          idempotency_key: idempotencyKey,
          eventId,
          ticketId,
          amount: event.price,
          status: OrderStatus.PENDING,
        });

        const savedOrder = await manager.save(Order, orderEntity);
        await this.eventService.deductInventory(eventId, manager);

        return savedOrder;
      });

      return OrderTransformer.toResponse(order);
    } finally {
      await this.redisService.releaseLock(lockKey, lockToken);
    }
  }
}
