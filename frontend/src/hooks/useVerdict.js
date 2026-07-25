import { useState, useCallback } from 'react';
import { fetchVerdict } from '../services/api';

export function useVerdict() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getVerdict = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchVerdict(username);
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    getVerdict,
    reset
  };
}
export default useVerdict;
