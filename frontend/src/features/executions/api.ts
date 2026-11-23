import { request } from "../../shared/lib/http";

export interface Execution {
  id: string;
  generator: string;
  status: "succeeded" | "failed";
  requested_at: string;
  requested_by: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export const executionApi = {
  get: (id: string) => request<Execution>(`/v1/executions/${encodeURIComponent(id)}`),
};
