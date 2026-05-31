import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from './../common/enums/ticket-status.enum';
import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

@Injectable()
export class TicketsService {
  constructor() {}

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
}
