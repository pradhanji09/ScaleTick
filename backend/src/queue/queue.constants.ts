export const QUEUE_NAMES = {
  ORDER: 'order.queue',
  EVENT: 'event.queue',
} as const;

export const JOB_NAMES = {
  ORDER_CONFIRMATION: 'order.confirmation',
  EVENT_GO_LIVE: 'event.go_live',
  EVENT_GO_ENDED: 'event.go_ended',
} as const;
