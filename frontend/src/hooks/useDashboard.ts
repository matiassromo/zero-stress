import { useEffect, useRef, useState } from "react";
import { getDashboardSnapshot, DashboardSnapshot } from "@/lib/api/dashboard";
import { onDashboardInvalidate } from "@/lib/events/bus";

export function useDashboard(pollMs = 10000) {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const timer = useRef<number | null>(null);

  async function load() {
    try {
      setError(null);
      const snap = await getDashboardSnapshot();
      setData(snap);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const off = onDashboardInvalidate(load);

    function onFocus() { load(); }
    window.addEventListener("focus", onFocus);

    timer.current = window.setInterval(load, pollMs);

    return () => {
      off();
      window.removeEventListener("focus", onFocus);
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [pollMs]);

  return { data, loading, error, reload: load };
}
