type Handler = () => void;
const listeners = new Set<Handler>();
const channel = typeof window !== "undefined" ? new BroadcastChannel("zs-events") : null;

export function onDashboardInvalidate(h: Handler) {
  listeners.add(h);
  return () => listeners.delete(h);
}
export function emitDashboardInvalidate() {
  listeners.forEach(h => h());
  if (channel) channel.postMessage({ type: "dashboard.invalidate" });
}
if (channel) {
  channel.onmessage = (ev) => {
    if (ev?.data?.type === "dashboard.invalidate") listeners.forEach(h => h());
  };
}
