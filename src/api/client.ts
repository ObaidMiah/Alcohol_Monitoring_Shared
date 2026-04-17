import type { ApiErrorResponse, ValidationErrorDetail } from "../types";

// ── Error classes ───────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fields: ValidationErrorDetail[],
  ) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// ── Client configuration ────────────────────────────────────────

interface ApiClientConfig {
  getToken: () => string | null | Promise<string | null>;
  baseUrl: string;
  onUnauthorized?: () => void;
}

let config: ApiClientConfig | null = null;

export function initApiClient(clientConfig: ApiClientConfig): void {
  config = clientConfig;
}

function getConfig(): ApiClientConfig {
  if (!config) {
    throw new Error(
      "API client not initialized. Call initApiClient() at app startup.",
    );
  }
  return config;
}

// ── Fetch wrapper ───────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { getToken, baseUrl, onUnauthorized } = getConfig();

  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new NetworkError(
      err instanceof Error ? err.message : "Network request failed",
    );
  }

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Unauthorized", 401);
  }

  if (response.status === 404) {
    return null as T;
  }

  if (!response.ok) {
    let body: ApiErrorResponse | undefined;
    try {
      body = await response.json();
    } catch {
      // response body may not be JSON
    }

    if (response.status === 400 && body?.details) {
      throw new ValidationError(
        body.error ?? "Validation failed",
        body.details,
      );
    }

    // Never expose raw server error messages to callers
    if (response.status >= 500) {
      throw new ApiError("An unexpected server error occurred", response.status);
    }

    throw new ApiError(
      body?.error ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
