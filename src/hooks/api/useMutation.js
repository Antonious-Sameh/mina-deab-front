// src/hooks/api/useMutation.js
// Hook for write operations (POST, PUT, PATCH, DELETE).
// Returns [mutate, { loading, error }]
// Usage:
//   const [createStudent, { loading }] = useMutation(studentsAPI.create, {
//     onSuccess: (data) => toast.success('تم الإنشاء'),
//     onError:   (err)  => toast.error(err),
//   });

import { useState, useCallback } from 'react';

const useMutation = (apiFn, options = {}) => {
  const { onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'حدث خطأ غير متوقع';
      setError(message);
      if (onError) onError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]); // eslint-disable-line

  return [mutate, { loading, error }];
};

export default useMutation;