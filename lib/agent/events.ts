export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "search"; query: string }
  | { type: "read"; url: string }
  | { type: "done"; slug: string }
  | { type: "error"; message: string };
