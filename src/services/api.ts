import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "/api";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

function toHeaderObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

function toRequestData(body?: BodyInit | null): unknown {
  if (!body) return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

export async function apiRequest(path: string, token: string, init: RequestInit = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method: init.method ?? "GET",
      data: toRequestData(init.body),
      headers: {
        Authorization: `Bearer ${token}`,
        ...toHeaderObject(init.headers),
      },
    });

    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          `Unable to connect to the service. Check that the backend is running and your API URL is correct (${apiBaseUrl}).`,
        );
      }

      const apiMessage =
        typeof error.response.data === "object" &&
        error.response.data &&
        "error" in error.response.data
          ? String((error.response.data as { error?: string }).error)
          : null;

      throw new Error(apiMessage || `API request failed (${error.response.status})`);
    }

    throw new Error("Unexpected API error.");
  }
}
