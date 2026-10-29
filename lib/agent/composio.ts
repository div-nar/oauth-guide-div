import type { Guide } from "@/lib/guide-schema";

// Whether Composio has its own (managed) app for this provider, read from its toolkit
// page by code rather than researched by the agent. The toolkit page says
// "Composio-managed OAuth available" when it does; no page means no toolkit.
export type FetchText = (url: string) => Promise<{ status: number; text: string }>;

const fetchText: FetchText = async (url) => {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  return { status: res.status, text: res.status === 200 ? await res.text() : "" };
};

export async function composioLookup(g: Pick<Guide, "slug" | "app">, get: FetchText = fetchText): Promise<Guide["composio"]> {
  const url = `https://docs.composio.dev/toolkits/${g.slug}`;
  try {
    const { status, text } = await get(url);
    if (status !== 200) return null;
    const managed = /Composio-managed OAuth available/i.test(text);
    return {
      managedApp: managed ? "yes" : "no",
      note: managed
        ? `Composio's own ${g.app.name} app lets people connect today while yours is set up or in review. Switch to your own app once it is approved.`
        : `Composio supports ${g.app.name}, but only with your own OAuth app.`,
      evidence: { level: "sourced", sources: [{ title: `${g.app.name} - Composio Toolkit`, url }], note: null },
      limits: null,
    };
  } catch {
    return null;
  }
}
