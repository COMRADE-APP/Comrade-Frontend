import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { params = {}, enabled = true, staleTime = 0 } = options;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(endpoint, { params });
            setData(response.data);
        } catch (err) {
            setError(err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, [endpoint, JSON.stringify(params)]);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        fetchData();
    }, [fetchData, enabled]);

    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch };
};

export const useMutation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (method, url, payload = null, config = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api[method](url, payload, config);
            setData(response.data);
            return response.data;
        } catch (err) {
            setError(err.response?.data || err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const mutate = useCallback((url, payload, config) => execute('post', url, payload, config), [execute]);
    const update = useCallback((url, payload, config) => execute('patch', url, payload, config), [execute]);
    const remove = useCallback((url, config) => execute('delete', url, undefined, config), [execute]);

    return { data, loading, error, mutate, update, remove, setData, setError };
};
