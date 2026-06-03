import { TicketAlreadyBooked, TicketNotFound } from './tickets.error';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './../common/enums/ticket-status.enum';
import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketTransformer } from './tickets.tranformer';
import { TicketResponse } from './tickets.types';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async bulkTicketGenerate({
    eventId,
    count,
    price,
    manager,
  }: {
    eventId: string;
    count: number;
    price: number;
    manager: EntityManager;
  }) {
    const CHUNK_SIZE = 1000;

    for (let i = 0; i < count; i += CHUNK_SIZE) {
      // Handle less than Chunk Size less than 1000
      const currentChunkSize = Math.min(CHUNK_SIZE, count - i);

      const ticketChunk = Array.from(
        { length: currentChunkSize },
        (_, index) => ({
          seat_number: i + index + 1,
          status: TicketStatus.AVAILABLE,
          price: price,
          eventId: eventId,
        }),
      );

      await manager.insert(Ticket, ticketChunk);
    }
  }

  async cancelTicketsForEvent(id: string, manager: EntityManager) {
    await manager.update(
      Ticket,
      {
        eventId: id,
        status: In([TicketStatus.AVAILABLE, TicketStatus.RESERVED]),
      },
      {
        status: TicketStatus.CANCELLED,
      },
    );
  }

  async getAvailableTicketsByEventId(
    eventId: string,
  ): Promise<TicketResponse[]> {
    const tickets = await this.ticketRepository.find({
      where: {
        eventId,
        status: TicketStatus.AVAILABLE,
      },
      order: { seat_number: 'ASC' },
    });

    return tickets.map((ticket) => TicketTransformer.toResponse(ticket));
  }

  async getTicketById(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
    });
    if (!ticket) throw TicketNotFound;

    return TicketTransformer.toResponse(ticket);
  }

  async reserveTicket(ticketId: string, manager: EntityManager) {
    const ticketInTx = await manager.findOne(Ticket, {
      where: { id: ticketId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!ticketInTx || ticketInTx.status !== TicketStatus.AVAILABLE)
      throw TicketAlreadyBooked;

    await manager.update(
      Ticket,
      { id: ticketId },
      { status: TicketStatus.SOLD },
    );
  }
}
