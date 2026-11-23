export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`Não foi possível concluir a operação (HTTP ${response.status}).`);
  }
  return (await response.json()) as T;
}
