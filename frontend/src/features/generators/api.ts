import { request } from "../../shared/lib/http";
import type { Execution } from "../executions/api";

export interface Generator {
  name: string;
  description: string;
}

export const generatorApi = {
  list: () => request<Generator[]>("/v1/generators"),
  execute: (name: string, parameters: Record<string, unknown>) =>
    request<Execution>(`/v1/generators/${encodeURIComponent(name)}/executions`, {
      method: "POST",
      body: JSON.stringify({ parameters }),
    }),
};
