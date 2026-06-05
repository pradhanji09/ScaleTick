import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "5s", // 5 seconds
};

const BASE_URL = "http://host.docker.internal:3000";

export default function () {
  const res = http.get(`${BASE_URL}/events`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
