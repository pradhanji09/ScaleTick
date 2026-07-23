<div align="center">
  <h1>🎟️ ScaleTick</h1>
  <p><strong>A production-grade flash sale and ticketing engine</strong></p>

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  
  <br />
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
  [![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)]()
</div>

---

## Table of Contents

- [What is ScaleTick?](#what-is-scaletick)
- [Why is it useful?](#why-is-it-useful)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Where to get help](#where-to-get-help)
- [Maintainers and Contributing](#maintainers-and-contributing)

---

## What is ScaleTick?

ScaleTick is a highly scalable, production-ready backend engine designed to handle massive flash sales and ticketing events. Built with NestJS, PostgreSQL, and Redis, it ensures that even when thousands of users attempt to purchase limited tickets at the exact same millisecond, the system processes transactions flawlessly.

## Why is it useful?

When high-demand tickets go live, traditional systems often fail, resulting in overselling, double charging, and server crashes. ScaleTick solves these critical issues with the following guarantees:

- **Zero Overselling:** Uses a two-layer protection strategy (Redis Distributed Locks and PostgreSQL Pessimistic Locking) so that you never sell more tickets than you have.
- **Zero Double Orders:** Implements idempotency keys to ensure users are only charged once, even if they double-click or experience network drops.
- **High Performance & Stability:** Designed to stay responsive under immense concurrent load, offloading non-critical tasks (like emails) to async queues (BullMQ).
- **Data Integrity:** Strict finite state machine (FSM) controls the event lifecycle, making illegal state transitions impossible.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/pradhanji09/ScaleTick.git
   cd ScaleTick
   ```

2. **Setup Environment Variables**
   Navigate to the backend directory and configure the environment:

   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Start Infrastructure (PostgreSQL & Redis)**
   From the project root:

   ```bash
   docker compose up -d
   ```

4. **Install Dependencies & Run**
   In the `backend/` directory:
   ```bash
   npm install
   npm run start:dev
   ```

The server will be running on `http://localhost:3000`.

### Usage Examples

Once the server is running, you can explore the API using the Swagger documentation available at:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

#### Example: Booking a Ticket

To safely book a ticket, provide a unique `x-idempotency-key` header with your request:

```bash
curl -X POST http://localhost:3000/orders/book \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "x-idempotency-key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-uuid-here",
    "ticketId": "ticket-uuid-here"
  }'
```

### Author & Maintainer

**Sourav Pradhan**  
Software Engineer | Node.js | NestJS | Distributed Systems  
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?logo=github)](https://github.com/pradhanji09) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/sourav-pradhann)

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
