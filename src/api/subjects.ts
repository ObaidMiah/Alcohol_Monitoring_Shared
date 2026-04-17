import type {
  CreateOfficerPayload,
  CreateSubjectPayload,
  EventFilterParams,
  EventsListResponse,
  MapSubject,
  Officer,
  OrgSettings,
  Reading,
  ReadingsListResponse,
  Subject,
  SubjectSummary,
  UpdateSubjectStatusPayload,
} from "../types";
import { apiFetch } from "./client";

// ── Subject reads ───────────────────────────────────────────────

export async function getSubjectReadings(
  subjectId: string,
  start?: string,
  end?: string,
  limit?: number,
): Promise<ReadingsListResponse> {
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);
  if (limit != null) query.set("limit", String(limit));
  const qs = query.toString();
  return apiFetch<ReadingsListResponse>(
    `/v1/subjects/${subjectId}/readings${qs ? `?${qs}` : ""}`,
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
  options?: EventFilterParams,
): Promise<EventsListResponse> {
  const query = new URLSearchParams();
  if (options?.start) query.set("start", options.start);
  if (options?.end) query.set("end", options.end);
  if (options?.event_type) query.set("event_type", options.event_type);
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

// ── Officer reads ───────────────────────────────────────────────

export async function getAllSubjectsForOfficer(
  officerId: string,
): Promise<Subject[]> {
  return apiFetch<Subject[]>(`/v1/officers/${officerId}/subjects`);
}

export async function getMapSubjects(
  officerId: string,
): Promise<MapSubject[]> {
  return apiFetch<MapSubject[]>(`/v1/map/subjects?officer_id=${officerId}`);
}

// ── Subject writes ──────────────────────────────────────────────

export async function createSubject(
  payload: CreateSubjectPayload,
): Promise<Subject> {
  return apiFetch<Subject>("/v1/subjects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSubjectStatus(
  subjectId: string,
  payload: UpdateSubjectStatusPayload,
): Promise<Subject> {
  return apiFetch<Subject>(`/v1/subjects/${subjectId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ── Officer writes ──────────────────────────────────────────────

export async function createOfficer(
  payload: CreateOfficerPayload,
): Promise<Officer> {
  return apiFetch<Officer>("/v1/officers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Org settings ────────────────────────────────────────────────

export async function getOrgSettings(
  orgId: string,
): Promise<OrgSettings> {
  return apiFetch<OrgSettings>(`/v1/orgs/${orgId}/settings`);
}

export async function updateOrgSettings(
  orgId: string,
  payload: Partial<Omit<OrgSettings, "id" | "org_id" | "created_at" | "updated_at">>,
): Promise<OrgSettings> {
  return apiFetch<OrgSettings>(`/v1/orgs/${orgId}/settings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
