import { useEffect, useState, useCallback, useRef } from 'react';

export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then((d) => setData(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { data, setData, loading, error, reload: run };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useInterval(fn, ms) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
