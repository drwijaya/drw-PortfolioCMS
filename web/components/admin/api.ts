export async function api<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers:
      body instanceof FormData ? {} : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 428) {
      await new Promise<void>((resolve, reject) =>
        window.dispatchEvent(
          new CustomEvent("cms-reauth", { detail: { resolve, reject } }),
        ),
      );
      return api<T>(path, method, body);
    }
    if (response.status === 401)
      window.dispatchEvent(new CustomEvent("cms-session-expired"));
    throw new Error(data.error ?? "Permintaan gagal");
  }
  return data as T;
}
export async function authApi<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const r = await fetch(`/api/auth/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok) {
    if (r.status === 428) {
      await new Promise<void>((resolve, reject) =>
        window.dispatchEvent(
          new CustomEvent("cms-reauth", { detail: { resolve, reject } }),
        ),
      );
      return authApi<T>(path, body);
    }
    throw new Error(data.message ?? data.error ?? "Autentikasi gagal");
  }
  return data as T;
}
