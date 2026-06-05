# ScaleTick — Load Test Results

> Proving concurrency safety and idempotency under real concurrent load using [k6](https://k6.io/).

---

## Test Environment

| Property     | Value                       |
| ------------ | --------------------------- |
| Tool         | k6 (via Docker)             |
| Server       | NestJS + Fastify            |
| Database     | PostgreSQL 15               |
| Cache / Lock | Redis 7                     |
| Machine      | Windows (local development) |

---

## Test 1 — Concurrent Booking (Concurrency Safety)

### Scenario

100 concurrent users simultaneously attempting to book from a pool of **50 available tickets** for a single LIVE event.

This simulates a real flash sale — all users hitting "Buy" at the exact same millisecond.

### Configuration

```
Virtual Users : 100
Duration      : 30 seconds
Tickets       : 50
Event Status  : LIVE
```

### Results

```
successful_bookings : 50      ✅ exactly 50 — zero overselling
failed_bookings     : 50      ✅ clean rejections
checks_succeeded    : 100%    ✅ all assertions passed
oversell_violations : 0       ✅ Redis lock worked perfectly

http_req_duration
  avg : 627ms
  p90 : 1.94s
  p95 : 2.23s

total requests : 300
  → 100 register
  → 100 login
  → 100 booking attempts
```

### What This Proves

- Redis distributed lock prevented any ticket from being sold twice
- PostgreSQL pessimistic write lock (`SELECT FOR UPDATE`) as second safety layer
- All 50 rejections returned clean error responses (`400` / `503`)
- Zero data corruption under concurrent load

---

## Test 2 — Idempotency (Double Click Protection)

### Scenario

Same user sends **two identical booking requests simultaneously** with the same `x-idempotency-key` header — simulating a double click or network retry.

### Configuration

```
Virtual Users      : 2 (same user, same key)
Duration           : 10 seconds
Idempotency Key    : shared UUID (same for both VUs)
```

### Results

```
successful_bookings : 1       ✅ only one order created
checks_succeeded    : 100%    ✅ all assertions passed

http_reqs : 4 total
  → 1 register
  → 1 login
  → 2 booking attempts (same key)
  → 1 succeeded, 1 blocked

http_req_failed : 25%
  = 1 duplicate request correctly rejected
```

### What This Proves

- First request sets Redis key to `PROCESSING`
- Second request sees `PROCESSING` → returns `409` immediately
- Only **1 order** exists in database after both requests complete
- User can never be double charged regardless of network issues

---

## How Concurrency Is Handled

```
POST /orders/book

1. IdempotencyInterceptor
   → Check Redis for existing key
   → PROCESSING? return 409
   → COMPLETED? return cached response
   → New? set PROCESSING atomically (NX)

2. Validate event is LIVE

3. Acquire Redis distributed lock
   → Lock key: lock:ticket:{ticketId}
   → Token-based ownership (Lua script release)
   → TTL: 10 seconds (auto-expires on crash)

4. PostgreSQL transaction
   → SELECT FOR UPDATE (pessimistic lock)
   → Re-validate ticket status inside transaction
   → Mark ticket SOLD
   → Create order CONFIRMED
   → Decrement available_tickets
   → If available_tickets === 0 → event SOLD_OUT

5. Release Redis lock (Lua script — safe release)

6. Cache response in Redis (idempotency COMPLETED)

7. Push BullMQ job → confirmation email async
```

---

## Running Tests Locally

### Prerequisites

```bash
# Start services
docker compose up -d

# Start NestJS server
npm run start:dev
```

### Concurrent Booking Test

```bash
docker run --rm -i grafana/k6 run - <load-tests/booking.test.js
```

### Idempotency Test

```bash
docker run --rm -i grafana/k6 run - <load-tests/idempotency.test.js
```

---

## Key Design Decisions

| Problem                       | Solution                            |
| ----------------------------- | ----------------------------------- |
| Two users booking same ticket | Redis distributed lock              |
| Lock released by wrong server | Token-based Lua script release      |
| Double click / network retry  | Idempotency key in Redis            |
| Partial save on crash         | PostgreSQL transaction              |
| Stale idempotency key         | 24h TTL + database permanent record |
| Event oversold                | Atomic available_tickets decrement  |
| Lock held forever on crash    | 10s TTL auto-expiry                 |

## Scale Targets

Tested locally at 100 concurrent VUs.
Architecture designed for horizontal scaling.
Production capacity depends on:
Database connection pool size
Redis memory and connection limits
Number of NestJS instances behind load balancer
PostgreSQL hardware specs
