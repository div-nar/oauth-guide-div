import type { Guide } from "@/lib/guide-schema";
import { getLibraryGuide } from "@/lib/library";

export async function getGuide(slug: string): Promise<Guide | null> {
  return getLibraryGuide(slug);
}
