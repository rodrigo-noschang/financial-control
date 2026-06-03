export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Erro ao processar requisicao.", response.status, payload?.details);
  }

  return payload as T;
}
