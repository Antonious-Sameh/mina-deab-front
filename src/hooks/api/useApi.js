// src/hooks/api/useApi.js
// Generic hook for data fetching with loading + error states.
// Usage:
//   const { data, loading, error, refetch } = useApi(() => studentsAPI.getAll({ year }), [year]);

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @param {Function} apiFn  - Function that returns a Promise (API call)
 * @param {Array}    deps   - Dependencies array (like useEffect)
 * @param {Object}   opts   - Options: { immediate: true, initialData: null }
 */
const useApi = (apiFn, deps = [], opts = {}) => {
  const { immediate = true, initialData = null } = opts;

  const [data,    setData]    = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Keep apiFn stable via ref so it doesn't trigger re-renders
  const apiFnRef = useRef(apiFn);
  useEffect(() => { apiFnRef.current = apiFn; });

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFnRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'حدث خطأ غير متوقع';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (immediate) execute();
  }, deps); // eslint-disable-line

  return { data, loading, error, refetch: execute };
};

export default useApi;