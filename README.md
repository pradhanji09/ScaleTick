# ScaleTick ⚡

> A production-grade flash sale and ticketing engine — built to handle thousands of users competing for limited tickets at the exact same moment, with zero overselling and zero duplicate orders.

---

## 🤔 What Problem Does This Solve?

Imagine a Coldplay concert announces tickets at 10:00 AM.

```
10:00:00.000 AM — Tickets go live
10:00:00.001 AM — 10,000 users click "Buy" simultaneously
10:00:00.002 AM — Only 500 tickets available

What happens without proper engineering?
  → Same ticket sold to multiple people
  → Server crashes under load
  → User charged twice from double-clicking
  → Data corruption in database

What ScaleTick guarantees?
  → Exactly 500 tickets sold — never more
  → Server stays alive under load
  → Double-click = safe, one charge only
  → Zero data corruption
```

This is the same problem solved by BookMyShow, IRCTC, and Zomato every day.

---

## ⚡ Live Demo

```bash
# Clone and run with one command
git clone https://github.com/pradhanji09/ScaleTick
cd scaletick/backend
docker compose up -d
npm install
npm run start:dev

# API Explorer
open http://localhost:3000/api/docs

# Health Check
open http://localhost:3000/health
```

---

## 🏗️ System Architecture

```
                         ┌─────────────────────────────┐
                         │         CLIENT              │
                         │  (Postman / Frontend App)   │
                         └──────────────┬──────────────┘
                                        │ HTTP Request
                                        ▼
                         ┌─────────────────────────────┐
                         │      NestJS + Fastify       │
                         │                             │
                         │  ┌─────────────────────┐    │
                         │  │   Auth Guard        │    │  ← Is user logged in?
                         │  │   Roles Guard       │    │  ← Is user admin?
                         │  │   Throttler Guard   │    │  ← Too many requests?
                         │  │   Idempotency Guard │    │  ← Duplicate request?
                         │  └──────────┬──────────┘    │
                         │             │               │
                         │  ┌──────────▼──────────┐    │
                         │  │    Controller       │    │  ← Route handler
                         │  └──────────┬──────────┘    │
                         │             │               │
                         │  ┌──────────▼──────────┐    │
                         │  │     Service         │    │  ← Business logic
                         │  └──────────┬──────────┘    │
                         └─────────────┼───────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
               ▼                       ▼                       ▼
  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
  │    PostgreSQL      │  │       Redis        │  │       BullMQ        │
  │                    │  │                    │  │                     │
  │  Permanent storage │  │  Distributed Lock  │  │  Async Job Queue    │
  │  ACID transactions │  │  Idempotency Cache │  │  Email confirmation │
  │  Indexed queries   │  │  Rate limit store  │  │  Event lifecycle    │
  └────────────────────┘  └────────────────────┘  └─────────────────────┘
```

---

## 🎯 The Booking Flow — Step by Step

This is the most critical part of ScaleTick. Here is exactly what happens when you click "Book":

```
User clicks BOOK
      │
      ▼
① IDEMPOTENCY CHECK (Redis)
  Already seen this request? → Return cached response
  Request in progress?       → Return 409, try again
  New request?               → Mark as PROCESSING, continue
      │
      ▼
② VALIDATE
  Is event LIVE?             → No  → Reject
  Does ticket belong here?   → No  → Reject
  Is ticket available?       → No  → Reject
      │
      ▼
③ ACQUIRE REDIS LOCK
  Lock key: lock:ticket:{ticketId}
  Got the lock?              → Continue
  Lock taken by someone else → Return 503, retry
      │
      ▼
④ DATABASE TRANSACTION
  SELECT ticket FOR UPDATE   ← Pessimistic DB lock
  Still available?           → Continue
  Already taken?             → Reject, release lock
      │
  Mark ticket  → SOLD
  Create order → CONFIRMED
  Decrement available_tickets by 1
  If available_tickets = 0 → Event → SOLD_OUT
  COMMIT
      │
      ▼
⑤ RELEASE REDIS LOCK
  Uses Lua script for safe release
  Only releases if WE own the lock
      │
      ▼
⑥ CACHE RESPONSE (Redis)
  Mark idempotency key as COMPLETED
  Store response for 24 hours
      │
      ▼
⑦ ASYNC JOB (BullMQ)
  Push confirmation email job to queue
  User does not wait for email
  Response returned immediately
      │
      ▼
✅ SUCCESS — Ticket is yours
```

---

## 🧠 Design Patterns Used

### 1. Finite State Machine (FSM) — Event Lifecycle

An event cannot jump to any status randomly. Every transition is controlled.

```
                    ┌──────────┐
                    │  DRAFT   │  ← Created by admin
                    └────┬─────┘
                         │ Admin schedules
                         ▼
                    ┌──────────┐
                    │SCHEDULED │  ← Visible to users
                    └────┬─────┘
                         │ BullMQ job fires at starts_at
                         ▼
              ┌──────────────────────┐
              │         LIVE         │  ← Booking open
              └──┬──────────────┬────┘
                 │              │
    All tickets  │              │ Time expires
    sold out     │              │ (BullMQ auto-fires)
                 ▼              ▼
           ┌─────────┐    ┌─────────┐
           │SOLD_OUT │    │  ENDED  │
           └─────────┘    └─────────┘

  At any point before ENDED:
           ┌───────────┐
           │ CANCELLED │  ← Admin action
           └───────────┘
```

Illegal transitions are **impossible by design**. You cannot go from ENDED back to LIVE.

---

### 2. Strategy Pattern — Pricing

Different events can have different pricing logic without changing core code.

```
                    ┌─────────────────┐
                    │ PricingStrategy │  ← Interface
                    │ calculatePrice()│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌──────────────┐ ┌────────────┐ ┌─────────────┐
    │FixedPricing  │ │EarlyBird   │ │DynamicPrice │
    │              │ │Pricing     │ │(AI-powered) │
    │₹499 always   │ │First 20%   │ │Rises with   │
    │              │ │get 30% off │ │demand       │
    └──────────────┘ └────────────┘ └─────────────┘

Add new pricing model = new class only
Zero changes to existing code
Open/Closed Principle ✅
```

---

### 3. Factory Pattern — Event Creation

Creating an event involves many decisions. The factory centralises all of it.

```
Controller says:
  "Create me a flash sale event"
          │
          ▼
  EventTransformer.toEventEntity(dto)
          │
          ▼
  Returns complete entity with:
    ✓ status = DRAFT (always starts here)
    ✓ available_tickets = total_tickets
    ✓ dates converted to Date objects
    ✓ defaults applied

Controller never knows HOW it's built.
Single Responsibility Principle ✅
```

---

### 4. Transformer Pattern — Response Shaping

Database entities are never returned directly. Transformers control what the API exposes.

```
Database Entity          API Response
─────────────────        ─────────────────
id         ────────────► id
email      ────────────► email
password   ──── HIDDEN ► (never exposed)
isAdmin    ────────────► isAdmin
createdAt  ────────────► createdAt
updatedAt  ──── HIDDEN ► (internal only)

UserTransformer.toResponse(user)
  → Guaranteed password never leaks
  → Same shape everywhere in codebase
  → Change response = change one file
```

---

## 🔒 How We Prevent Overselling

Two layers of protection working together:

```
Layer 1 — Redis Distributed Lock
────────────────────────────────
"Only one booking can process
 a specific ticket at a time"

User A ──► SET lock:ticket:123 (NX EX 10)  ← Wins the lock
User B ──► SET lock:ticket:123 (NX EX 10)  ← Lock exists, fails
User C ──► SET lock:ticket:123 (NX EX 10)  ← Lock exists, fails

Only User A proceeds.
NX = only set if Not eXists (atomic)
EX = auto-expire in 10s (crash safety)

Lock Release Safety (Lua Script):
  Each lock has a unique token.
  Only the owner can release it.
  Prevents Server A releasing Server B's lock.

Layer 2 — PostgreSQL Pessimistic Lock
──────────────────────────────────────
"Even if two somehow get through,
 database guarantees only one wins"

SELECT * FROM tickets
WHERE id = ? FOR UPDATE  ← Row locked at DB level

Inside transaction:
  Re-check ticket status
  If SOLD → reject
  If AVAILABLE → mark SOLD, commit
```

---

## 🛡️ How We Prevent Double Charging

```
The Problem:
  User clicks Buy
  Network is slow
  User clicks Buy again
  Two requests, same moment
  Two charges?

The Solution — Idempotency:

Client generates UUID before clicking:
  idempotencyKey = "550e8400-e29b-41d4-a716-446655440000"

Request 1 arrives:
  Redis: key not found
  SET key "PROCESSING" (atomic NX)
  Process booking...
  SET key "COMPLETED" + response
  Return success

Request 2 arrives (same key):
  Redis: key = "PROCESSING"
  Return 409 "Already processing"
  Client retries after 1 second
  Redis: key = "COMPLETED"
  Return cached success response

Result: One order. One charge. Always.
```

---

## 📊 Load Test Results

Proven under real concurrent load using k6.

### Test 1 — Concurrent Booking

```
Scenario: 100 users hit Book simultaneously
          Only 50 tickets available

┌─────────────────────────────────────────┐
│  successful_bookings  :  50   ✅        │
│  failed_bookings      :  50   ✅        │
│  oversell_violations  :  0    ✅        │
│  checks_succeeded     :  100% ✅        │
│                                         │
│  avg response time    :  627ms          │
│  p95 response time    :  2.23s          │
└─────────────────────────────────────────┘

Result: Exactly 50 tickets sold.
        Not 51. Not 49. Exactly 50.
        Redis lock worked perfectly.
```

### Test 2 — Idempotency (Double Click)

```
Scenario: Same user, same key, 2 simultaneous requests

┌─────────────────────────────────────────┐
│  successful_bookings  :  1    ✅        │
│  duplicate_blocked    :  1    ✅        │
│  checks_succeeded     :  100% ✅        │
└─────────────────────────────────────────┘

Result: Only 1 order created.
        Double click is completely safe.
```

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────┐
│    users     │       │    events    │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ email        │       │ event_title  │
│ password     │       │ total_tickets│
│ isAdmin      │       │ avail_tickets│
│ createdAt    │       │ price        │
└──────┬───────┘       │ status (FSM) │
       │               │ starts_at    │
       │               │ ends_at      │
       │               └──────┬───────┘
       │                      │
       │               ┌──────▼───────┐
       │               │   tickets    │
       │               │──────────────│
       │               │ id (PK)      │
       │               │ seat_number  │
       │               │ status       │
       │               │ price        │
       │               │ event_id(FK) │
       │               └──────┬───────┘
       │                      │
       └──────────┐    ┌──────┘
                  │    │
              ┌───▼────▼─────┐
              │    orders    │
              │──────────────│
              │ id (PK)      │
              │ idempotency  │
              │ _key         │
              │ status       │
              │ amount ◄─────┼── Price snapshot
              │ user_id (FK) │   at booking time
              │ event_id(FK) │
              │ ticket_id(FK)│
              └──────────────┘
```

**Database Indexes:**

```
orders(userId, eventId)    → booking duplicate check
orders(userId)             → order history queries
tickets(eventId, status)   → available ticket lookup
tickets(eventId)           → bulk cancellation
events(status)             → live event listing
```

---

## 🚀 Tech Stack

| Layer      | Technology              | Why                                  |
| ---------- | ----------------------- | ------------------------------------ |
| Framework  | NestJS + Fastify        | Fast, structured, decorator-based    |
| Language   | TypeScript              | Type safety, better DX               |
| Database   | PostgreSQL              | ACID transactions, row-level locking |
| ORM        | TypeORM                 | Data Mapper pattern, migrations      |
| Cache/Lock | Redis + ioredis         | Atomic operations, distributed state |
| Queue      | BullMQ                  | Persistent jobs, retry logic         |
| Auth       | JWT + Passport + bcrypt | Industry standard                    |
| Logger     | Pino                    | Fastest Node.js logger, JSON output  |
| Docs       | Swagger                 | Auto-generated API explorer          |
| Load Test  | k6                      | Industry standard load testing       |
| Container  | Docker + docker-compose | One command setup                    |

---

## 📁 Project Structure

```
src/
├── auth/                    ← JWT auth, register, login
│   ├── dto/                 ← Input validation
│   ├── strategies/          ← Passport JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.errors.ts       ← Domain specific errors
│   └── auth.module.ts
│
├── events/                  ← Flash sale management
│   ├── dto/
│   ├── entities/
│   ├── transitions/         ← FSM state machine
│   ├── events.transformer.ts
│   ├── events.types.ts
│   └── ...
│
├── tickets/                 ← Ticket inventory
├── orders/                  ← Core booking engine
│
├── common/
│   ├── errors/              ← RestErrorProvider pattern
│   ├── guards/              ← JWT, Roles, Throttler
│   ├── decorators/          ← @Public, @AdminOnly, @CurrentUser
│   ├── interceptors/        ← Idempotency interceptor
│   ├── exceptions/          ← Global exception filter
│   └── redis/               ← Redis service (lock + idempotency)
│
├── queue/
│   ├── processors/          ← BullMQ job processors
│   └── queue.constants.ts   ← Queue and job names
│
└── health/                  ← DB + Redis health checks
```

---

## 🔌 API Endpoints

```
AUTH
  POST  /auth/register     → Create account
  POST  /auth/login        → Get JWT token

EVENTS
  POST  /events            → Create event (admin)
  GET   /events            → List live + scheduled events
  GET   /events/:id        → Single event details
  GET   /events/:id/tickets → Available tickets
  PATCH /events/:id/status → Change event state (admin)

ORDERS
  POST  /orders/book       → Book a ticket (requires x-idempotency-key)
  GET   /orders/my-orders  → My booking history

HEALTH
  GET   /health            → Database + Redis status
```

---

## 🔐 Security

```
✅ JWT authentication on all private routes
✅ bcrypt password hashing (10 rounds)
✅ Rate limiting (Redis backed)
   → Login: 5 attempts/minute
   → Register: 10 attempts/minute
   → Booking: 10 attempts/minute
✅ Security headers via Helmet
✅ Input validation on every endpoint
✅ Admin routes protected by role guard
✅ Idempotency key UUID validation
✅ Lock token ownership (prevents wrong release)
```

---

## 🏃 Getting Started

### Prerequisites

```
Node.js 18+
Docker Desktop
```

### Setup

```bash
# 1. Clone repository
git clone https://github.com/pradhanji09/ScaleTick
cd scaletick/backend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start PostgreSQL and Redis
docker compose up -d

# 5. Start development server
npm run start:dev

# 6. Open API explorer
open http://localhost:3000/api/docs
```

### Environment Variables

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=scaletick
POSTGRES_PASSWORD=scaletick123
POSTGRES_DB=scaletick_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

---

## 🧪 Running Load Tests

```bash
# Concurrent booking test (proves zero overselling)
docker run --rm -i grafana/k6 run - <load-tests/booking.test.js

# Idempotency test (proves double-click safety)
docker run --rm -i grafana/k6 run - <load-tests/idempotency.test.js
```

See [load-tests/LOAD_TEST_RESULTS.md](./load-tests/LOAD_TEST_RESULTS.md) for detailed results.

---

## 🗺️ What I Would Add Next

```
[ ] Razorpay payment gateway integration
    → PENDING → payment → CONFIRMED flow
    → Webhook signature verification
    → Failed payment releases ticket automatically

[ ] TypeORM migrations
    → Switch synchronize: false
    → Versioned schema changes

[ ] Prometheus + Grafana monitoring
    → Real time request rate dashboard
    → Redis lock acquisition metrics
    → BullMQ queue depth monitoring

[ ] Multiple ticket booking
    → One order → multiple tickets
    → Atomic multi-lock acquisition
```

---

## 👤 Author

**Sourav Pradhan**
Software Engineer | Node.js | NestJS | Distributed Systems

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/sourav-pradhann)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/pradhanji09)
