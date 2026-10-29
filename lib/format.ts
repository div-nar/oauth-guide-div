type Range = { min: number; max: number };

function unitLabel(n: number, unit: "min" | "day") {
  return unit === "min" ? "min" : n === 1 ? "day" : "days";
}

export function formatRange(r: Range, unit: "min" | "day"): string {
  if (r.min === r.max) return `${r.min} ${unitLabel(r.max, unit)}`;
  return `${r.min} to ${r.max} ${unitLabel(r.max, unit)}`;
}

export function formatHandsOn(r: Range): string {
  if (r.max >= 90) return `${Math.round((r.min / 60) * 2) / 2} to ${Math.round((r.max / 60) * 2) / 2} hours`;
  return formatRange(r, "min");
}

export function formatWait(r: Range): string {
  if (r.max === 0) return "None";
  if (r.min >= 14) return `${Math.round(r.min / 7)} to ${Math.round(r.max / 7)} weeks`;
  return formatRange(r, "day");
}
