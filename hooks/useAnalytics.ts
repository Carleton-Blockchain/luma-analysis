import { useState, useEffect } from "react";
import {
  fetchAnalyticsData,
  type AnalyticsData,
} from "@/services/analyticsService";

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const analyticsData = await fetchAnalyticsData();
        setData(analyticsData);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load analytics")
        );
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { loading, error, data };
}
