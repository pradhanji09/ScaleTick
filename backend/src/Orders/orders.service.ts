import { JOB_NAMES, QUEUE_NAMES } from '../common/queue/queue.constants';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderResponse, OrderDetailResponse } from './orders.type';
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
import { DataSource, Repository } from 'typeorm';
import { TicketDoesNotBelongToEvent } from 'src/Tickets/tickets.error';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrdersService {
  private readonly LOCK_TTL = 10;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectQueue(QUEUE_NAMES.ORDER)
    private readonly orderQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly eventService: EventsService,
    private readonly ticketService: TicketsService,
    private readonly redisService: RedisService,
  ) {}

  async createOrder(
    body: CreateOrderDto,
    user: User,
    idempotencyKey: string,
  ): Promise<OrderResponse> {
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
          status: OrderStatus.CONFIRMED,
        });

        const savedOrder = await manager.save(Order, orderEntity);
        await this.eventService.deductInventory(eventId, manager);

        return savedOrder;
      });

      await this.orderQueue.add(JOB_NAMES.ORDER_CONFIRMATION, {
        orderId: order.id,
        userEmail: user.email,
        eventTitle: event.event_title,
        seatNumber: ticket.seat_number,
        amount: Number(event.price),
      });

      return OrderTransformer.toResponse(order);
    } finally {
      await this.redisService.releaseLock(lockKey, lockToken);
    }
  }

  async getMyOrderList(
    user: User,
    query: GetOrdersDto,
  ): Promise<{ data: OrderDetailResponse[]; meta: object }> {
    const { id: userId } = user;
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereClause: Record<string, any> = {
      userId,
    };
    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where: whereClause,
      order: { created_at: 'DESC' },
      take: limit,
      skip: skip,
      relations: ['event', 'ticket'],
    });

    return {
      data: orders.map((order) => OrderTransformer.toDetailResponse(order)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
