import { useEffect, useState } from "react";
import { findNearbyCities } from "@/lib/nearby-cities";

export function useNearbyCities(city: string | null | undefined, state: string | null | undefined) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city?.trim() || !state?.trim()) {
      setCities([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    findNearbyCities(city, state)
      .then((result) => {
        if (!cancelled) {
          setCities(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city, state]);

  return { cities, loading };
}
