// Browser-side list of research jobs this visitor started, so progress can follow
// them around the site. Losing it only hides the header pill; the job keeps running.
export type TrackedJob = { id: number; query: string; slug: string };

const KEY = "oauth-guides:research";
const EVENT = "oauth-guides:research-change";

export function readJobs(): TrackedJob[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(jobs: TrackedJob[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs.slice(-5)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function trackJob(job: TrackedJob) {
  write([...readJobs().filter((j) => j.id !== job.id), job]);
}

export function untrackJob(id: number) {
  write(readJobs().filter((j) => j.id !== id));
}

export function onJobsChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
