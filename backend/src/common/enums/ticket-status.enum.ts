export enum TicketStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED', // locked, payment pending
  SOLD = 'SOLD', // payment confirmed
  CANCELLED = 'CANCELLED', // released back to pool
}
