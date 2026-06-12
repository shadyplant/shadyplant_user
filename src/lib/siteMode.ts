const DEFAULT_MAINTENANCE_MESSAGE =
  "We are updating the store right now. Please check back again soon.";

function isTruthyEnvValue(value: string | undefined) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  return ["true", "1", "yes", "on"].includes(normalizedValue);
}

export function isMaintenanceModeEnabled() {
  return isTruthyEnvValue(process.env.NEXT_PUBLIC_SITE_MAINTENANCE_MODE);
}

export function getMaintenanceMessage() {
  const message = String(
    process.env.NEXT_PUBLIC_SITE_MAINTENANCE_MESSAGE || "",
  ).trim();

  return message || DEFAULT_MAINTENANCE_MESSAGE;
}
