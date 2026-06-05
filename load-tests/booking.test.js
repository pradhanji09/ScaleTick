import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = "http://host.docker.internal:3000";

const successfulBookings = new Counter("successful_bookings");
const failedBookings = new Counter("failed_bookings");

const EVENT_ID = "f3e173a7-a4b3-4888-9842-c98683b1b3b6";

// Clean unique ticket IDs only
const TICKET_IDS = [
  "81396feb-0149-4dec-8c1a-78e26df3e5fb",
  "7524e8ff-191c-4d69-bf7d-d0886caa4df8",
  "d2d1cd7c-2de4-44ab-9ff1-81b81b749ec8",
  "207a6ccd-ea5b-41e4-8732-a6ec37ea9b93",
  "8ff0b450-0590-44d1-8f12-c6a9adf7963e",
  "df18e139-e64a-41cf-9b84-173e003349b8",
  "5f93ac87-3f5b-4445-8694-4930cde6a6eb",
  "8f6e52fd-7fb3-4052-9ff9-1cd8ca609d25",
  "67c06e02-cf17-42eb-8346-f7ae627612ec",
  "ed11a9cc-c13b-46d2-817e-8699137633e4",
  "6ae31a1d-0758-4b03-8569-e8f3c66f1b8a",
  "9dfeab5c-d2e8-48f5-9530-d913f9408af1",
  "cd07f465-3375-4c4c-a350-7d2a80932c15",
  "93dea29f-2874-4472-afb0-9ea2006dff60",
  "5c05ec73-1d1b-4548-aa57-81f09ea79d64",
  "cce9426b-67b4-4acc-b894-b84f99cd60d4",
  "9a146ad4-9c24-469f-8951-9877f29401f1",
  "4d0ed5f9-81c6-419b-9804-ac7900c7846c",
  "843226d9-c66b-44c8-9a59-d02d724ea3a6",
  "51f0934f-4497-4246-8368-b65473e1b25f",
  "0716c1c7-af6b-456f-93b8-61a1a3b96664",
  "0955a3d7-3f7e-4fb6-8821-a03f941260dc",
  "012e8958-2a10-4793-8db9-a1806e243746",
  "50442203-bf50-4274-80fe-68e56d5d0023",
  "17abde77-f398-4945-bd9b-5af41929504a",
  "315c67ba-7fdc-43a7-ad38-2ca9877fdf1f",
  "df158733-56ed-4d19-974f-e120421bc5da",
  "c16a1206-1674-4647-93a1-531415a088c4",
  "fc85208c-a65f-432d-afe0-90fa7e852ae9",
  "f921f1ce-92c0-46bf-9595-0cbe879ec310",
  "ea23b385-d21a-4005-bb39-9478f5b94587",
  "f2f4baf7-b520-459f-8bf2-afe06d468e56",
  "605da576-8364-4b29-8063-36f275178906",
  "c531fa9b-8fa2-4f84-839d-e97fad5bb97b",
  "4d25484e-6a44-4f67-984d-5e6abd880e24",
  "c2fb33d1-c6f4-49ab-969a-b830d7e07631",
  "9fb1b05f-0b90-4add-9a70-9f288e6f8640",
  "08def21d-5f76-43a3-9215-5d738b1b7eee",
  "96786e98-97c1-4778-b119-5eee1108df1b",
  "9be177f1-c3b6-4e40-adf7-5aefa07baa3d",
  "a0861e51-2003-4a5e-9d43-ba196acefef5",
  "17cff735-cf6b-410a-a439-3fe148340803",
  "96355d5d-461a-4b7e-8032-2410af7477fc",
  "16bb8b97-4583-495e-8bd3-552106a2b85c",
  "e5aaef24-0d2b-409d-b517-ec65309b63e1",
  "b45b642f-1fe2-4cdb-b3d2-6a020bed9c53",
  "91594927-a2dc-4d29-8990-92a70383014e",
  "39bf61e9-9d00-461b-9089-c403d1b7af26",
  "5aa5a9a6-9177-441a-a483-1a8928a8b263",
  "3b8b8674-de2c-4ec7-8091-f45d2bba5cf7",
];

export const options = {
  vus: 100,
  duration: "30s",
  thresholds: {
    successful_bookings: ["count<=50"],
  },
};

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function setup() {
  for (let i = 1; i <= 100; i++) {
    http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        email: `booking_user_${i}@test.com`,
        password: "password123",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const tokens = [];
  for (let i = 1; i <= 100; i++) {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `booking_user_${i}@test.com`,
        password: "password123",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
    tokens.push(JSON.parse(res.body).access_token);
  }

  return { tokens };
}

export default function (data) {
  // Each VU only attempts ONE booking
  if (__ITER > 0) return;

  const { tokens } = data;
  const token = tokens[__VU - 1];

  // Each VU picks ticket based on its number
  // Spreads load across all tickets evenly
  const ticketId = TICKET_IDS[(__VU - 1) % TICKET_IDS.length];

  // Each VU has its own unique idempotency key
  const idempotencyKey = generateUUID();

  const res = http.post(
    `${BASE_URL}/orders/book`,
    JSON.stringify({ eventId: EVENT_ID, ticketId }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-idempotency-key": idempotencyKey,
      },
    },
  );

  if (res.status === 200 || res.status === 201) {
    successfulBookings.add(1);
    check(res, {
      "booking confirmed": (r) => JSON.parse(r.body).id !== undefined,
    });
  } else {
    failedBookings.add(1);
    check(res, {
      "rejection is clean": (r) =>
        r.status === 400 ||
        r.status === 409 ||
        r.status === 503 ||
        r.status === 404,
    });
  }

  sleep(0.1);
}
