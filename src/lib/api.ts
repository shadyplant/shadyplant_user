// const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_API_BASE_URL = "http://192.168.1.34:8080/api/v1";

function isLocalHostname(hostname: string) {
  const normalizedHostname = String(hostname || "").trim().toLowerCase();
  return (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1"
  );
}

function buildBrowserApiBaseUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_API_BASE_URL;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:8080/api/v1`;
}

export type ApiResponse<T> = {
  message: string;
  data: T;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getApiBaseUrl() {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

  if (!configuredBaseUrl) {
    return typeof window === "undefined"
      ? DEFAULT_API_BASE_URL
      : buildBrowserApiBaseUrl();
  }

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl);

    if (!isLocalHostname(parsedUrl.hostname) || isLocalHostname(window.location.hostname)) {
      return configuredBaseUrl;
    }

    parsedUrl.hostname = window.location.hostname;
    if (!parsedUrl.port) {
      parsedUrl.port = "8080";
    }

    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return buildBrowserApiBaseUrl();
  }
}

function buildHeaders(
  headers: HeadersInit | undefined,
  body: BodyInit | null | undefined,
) {
  const nextHeaders = new Headers(headers);

  if (body && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json");
  }

  return nextHeaders;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: buildHeaders(init.headers, init.body),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}
