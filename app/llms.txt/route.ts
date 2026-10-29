import { getBaseUrl } from "@/lib/base-url";
import { buildIndex } from "@/lib/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await buildIndex(await getBaseUrl()), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
