const DAY = 24 * 60 * 60 * 1000;

export function formatFullDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function deadlineLabel(deadline) {
  const ms = new Date(deadline).getTime() - Date.now();

  if (ms < 0) {
    const days = Math.max(1, Math.ceil(-ms / DAY));
    return `Overdue by ${days} day${days > 1 ? "s" : ""}`;
  }

  const days = Math.max(1, Math.ceil(ms / DAY));
  return days === 1 ? "1 day left" : `${days} days left`;
}