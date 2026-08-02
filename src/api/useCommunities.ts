import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchCommunities, type ApiCommunity } from "./communities";
import { mapApiCommunity } from "./mappers";
import type { Community } from "../types";

type State = {
  communities: Community[];
  raw: ApiCommunity[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/** Shared loader for screens that need the full community list. */
export function useCommunities(): State {
  const [raw, setRaw] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCommunities();
        if (!cancelled) setRaw(data);
      } catch (err) {
        if (!cancelled) {
          setRaw([]);
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const communities = useMemo(
    () =>
      raw
        .map(mapApiCommunity)
        .filter(
          (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
        ),
    [raw],
  );

  return {
    communities,
    raw,
    loading,
    error,
    reload,
  };
}
