import http from "k6/http";
import { check } from "k6";

const BASE_URL = "http://host.docker.internal:3000";

export const options = {
  vus: 10,
  duration: "10s",
};

export default function () {
  const email = `loadtest_${__VU}@test.com`;

  http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password: "password123" }),
    { headers: { "Content-Type": "application/json" } },
  );

  // Login
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: "password123" }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, {
    "login successful": (r) => r.status === 201,
    "has access token": (r) => JSON.parse(r.body).access_token !== undefined,
  });
}
