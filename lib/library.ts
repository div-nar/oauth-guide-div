import github from "@/data/guides/github.json";
import gmail from "@/data/guides/gmail.json";
import hubspot from "@/data/guides/hubspot.json";
import linkedin from "@/data/guides/linkedin.json";
import slack from "@/data/guides/slack.json";
import { type Guide, parseGuide } from "@/lib/guide-schema";

// Static imports so the guides are bundled for serverless routes.
const guides: Guide[] = [github, slack, gmail, hubspot, linkedin].map(parseGuide);

export function listLibraryGuides(): Guide[] {
  return guides;
}

export function getLibraryGuide(slug: string): Guide | null {
  return guides.find((g) => g.slug === slug) ?? null;
}
