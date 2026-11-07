import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";

// GET request ekak karala data / loading / error denawa
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params || {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(url, { params: JSON.parse(key) })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, key]);

  return { data, error, loading };
}