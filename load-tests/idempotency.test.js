import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = "http://host.docker.internal:3000";

const successfulBookings = new Counter("successful_bookings");
const cachedResponses = new Counter("cached_responses");

const EVENT_ID = "f3e173a7-a4b3-4888-9842-c98683b1b3b6";
const TICKET_ID = "012e8958-2a10-4793-8db9-a1806e243746";

export const options = {
  vus: 2,
  duration: "10s",
  thresholds: {
    successful_bookings: ["count==1"], // exactly 1 booking
  },
};

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Shared key : both VUs use this exact same key
const SHARED_IDEMPOTENCY_KEY = generateUUID();

export function setup() {
  // Register one user
  http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: "idempotency_test@test.com",
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  // Login and get token
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: "idempotency_test@test.com",
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  const token = JSON.parse(res.body).access_token;
  return { token };
}

export default function (data) {
  // Stop after first iteration
  if (__ITER > 0) return;

  const { token } = data;

  // Both VUs use same token + same idempotency key
  const res = http.post(
    `${BASE_URL}/orders/book`,
    JSON.stringify({ eventId: EVENT_ID, ticketId: TICKET_ID }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-idempotency-key": SHARED_IDEMPOTENCY_KEY,
      },
    },
  );

  if (res.status === 200 || res.status === 201) {
    successfulBookings.add(1);
    check(res, {
      "booking confirmed": (r) => JSON.parse(r.body).id !== undefined,
    });
  } else if (res.status === 409) {
    // 409 = request already processing = idempotency working
    cachedResponses.add(1);
    check(res, {
      "idempotency blocked duplicate": (r) => r.status === 409,
    });
  }

  sleep(0.1);
}
