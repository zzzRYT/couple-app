import { useEffect, useState } from 'react';
/** Wall clock for D-day and lease displays; the server stays authoritative for expiry. */
export function useNow(intervalMs = 30_000): string {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => { const timer = setInterval(() => setNow(new Date().toISOString()), intervalMs); return () => clearInterval(timer); }, [intervalMs]);
  return now;
}
