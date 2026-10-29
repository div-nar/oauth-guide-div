export function minimalGuide(overrides: Record<string, unknown> = {}) {
  return {
    slug: "acme",
    app: { name: "Acme", website: "https://acme.example" },
    lastChecked: "2026-10-28",
    generatedBy: "library",
    oauth: { supported: true },
    verdict: {
      difficulty: "easy",
      handsOnMinutes: { min: 5, max: 15 },
      waitDays: { min: 0, max: 0 },
      summary: "Self-serve form, no review.",
    },
    useCases: [
      {
        id: "default",
        label: "Read and write data",
        difficulty: "easy",
        handsOnMinutes: { min: 5, max: 15 },
        waitDays: { min: 0, max: 0 },
        summary: "No review.",
        scopes: [],
        stepIds: [] as string[],
        evidence: { level: "sourced", sources: [{ url: "https://acme.example/docs", title: "Docs" }] },
      },
    ],
    composio: {
      managedApp: "yes",
      note: "Composio has its own Acme app you can use while yours is set up.",
      evidence: { level: "sourced", sources: [{ url: "https://docs.composio.dev/toolkits/managed-auth", title: "Composio managed auth" }] },
    },
    whoYouNeed: [],
    steps: [
      {
        id: "create-app",
        owner: "agent",
        title: "Create the OAuth app",
        plain: "Fill in the app's name and the address users return to.",
        link: { url: "https://acme.example/apps/new", label: "Open the new app form", prefilled: false },
        evidence: { level: "sourced", sources: [{ url: "https://acme.example/docs", title: "Docs" }] },
      },
    ],
    forks: [],
    nuances: [],
    config: { scopes: [] },
    ...overrides,
  };
}
