import type { CreateReadingPayload, CreateReadingResponse } from "../types";
import { apiFetch } from "./client";

export async function postReading(
  payload: CreateReadingPayload,
): Promise<CreateReadingResponse> {
  return apiFetch<CreateReadingResponse>("/v1/readings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
