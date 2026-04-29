import type {
  AlertItem,
  AlertsFilterParams,
  EventFilterParams,
  EventsListResponse,
  MapSubject,
  Reading,
  ReadingsFilterParams,
  ReadingsListResponse,
  SubjectDetail,
  SubjectListItem,
  SubjectSummary,
} from "../types";
import { apiFetch } from "./client";

// ── Subject reads ───────────────────────────────────────────────

export async function getSubjects(): Promise<SubjectListItem[]> {
  return apiFetch<SubjectListItem[]>("/v1/subjects");
}

export async function getSubjectDetail(
  subjectId: string,
): Promise<SubjectDetail> {
  return apiFetch<SubjectDetail>(`/v1/subjects/${subjectId}`);
}

export async function getSubjectReadings(
  subjectId: string,
  params: ReadingsFilterParams,
): Promise<ReadingsListResponse> {
  const query = new URLSearchParams();
  query.set("start", params.start);
  query.set("end", params.end);
  if (params.limit != null) query.set("limit", String(params.limit));
  return apiFetch<ReadingsListResponse>(
    `/v1/subjects/${subjectId}/readings?${query}`,
  );
}

export async function getLatestReading(
  subjectId: string,
): Promise<Reading | null> {
  return apiFetch<Reading | null>(
    `/v1/subjects/${subjectId}/readings/latest`,
  );
}

export async function getSubjectEvents(
  subjectId: string,
  params?: EventFilterParams,
): Promise<EventsListResponse> {
  const query = new URLSearchParams();
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<EventsListResponse>(
    `/v1/subjects/${subjectId}/events${qs ? `?${qs}` : ""}`,
  );
}

export async function getSubjectSummary(
  subjectId: string,
): Promise<SubjectSummary> {
  return apiFetch<SubjectSummary>(`/v1/subjects/${subjectId}/summary`);
}

// ── Map ─────────────────────────────────────────────────────────

export async function getMapSubjects(): Promise<MapSubject[]> {
  return apiFetch<MapSubject[]>("/v1/subjects/map");
}

// ── Alerts ──────────────────────────────────────────────────────

export async function getAlerts(
  params?: AlertsFilterParams,
): Promise<AlertItem[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<AlertItem[]>(`/v1/alerts${qs ? `?${qs}` : ""}`);
}

// ── Me ──────────────────────────────────────────────────────────

export async function getMe(): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/v1/me");
}
