import type {
  BatchEventResponse,
  CreateEventPayload,
  CreateEventResponse,
} from "../types";
import { apiFetch } from "./client";

export async function postEvent(
  payload: CreateEventPayload,
): Promise<CreateEventResponse> {
  return apiFetch<CreateEventResponse>("/v1/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function postEventBatch(
  events: CreateEventPayload[],
): Promise<BatchEventResponse> {
  return apiFetch<BatchEventResponse>("/v1/events/batch", {
    method: "POST",
    body: JSON.stringify(events),
  });
}
