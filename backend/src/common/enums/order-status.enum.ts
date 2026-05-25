export enum OrderStatus {
  PENDING = 'PENDING', // created, payment not done
  CONFIRMED = 'CONFIRMED', // payment success
  FAILED = 'FAILED', // payment failed
  REFUNDED = 'REFUNDED', // money returned
}
